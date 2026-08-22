from fastapi import APIRouter, HTTPException, Response
import uuid
from datetime import datetime
from typing import List
from schemas import SaleCreate
from products import PRODUCTS_DB, STOCK_MOVEMENTS_DB
from database import supabase

router = APIRouter(prefix="/sales", tags=["Sales"])

SALES_DB = []

@router.get("/")
def get_sales(response: Response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    if supabase:
        try:
            result = supabase.table("sales").select("*, sale_items(*)").order("created_at", desc=True).execute()
            if result.data is not None:
                return [
                    {
                        **sale,
                        "items": sale.get("sale_items", []) or []
                    }
                    for sale in result.data
                ]
        except Exception as e:
            print(f"Supabase read failed, returning in-memory: {e}")
    return SALES_DB

@router.post("/")
def process_sale(sale: SaleCreate):
    total_amount = 0.0
    estimated_profit = 0.0
    processed_items = []

    # Get active product list (from Supabase if connected, else in-memory)
    active_prods = list(PRODUCTS_DB)
    if supabase:
        try:
            res = supabase.table("products").select("*").execute()
            if res.data and len(res.data) > 0:
                active_prods = res.data
        except Exception as e:
            print(f"Supabase fetch active products warning: {e}")

    # Validate stock and build processed items list
    for item in sale.items:
        prod = next((p for p in active_prods if str(p.get("id")) == str(item.product_id) or str(p.get("sku")) == str(item.product_id)), None)
        if not prod:
            prod = next((p for p in PRODUCTS_DB if str(p.get("id")) == str(item.product_id) or str(p.get("sku")) == str(item.product_id)), None)
        if not prod:
            # Fallback mock product if matching by string name
            prod = {"id": item.product_id, "name": "Item", "cost_price": item.unit_price * 0.7, "selling_price": item.unit_price, "stock_quantity": 999}
        
        cost_price = float(prod.get("cost_price", 0.0))
        item_total = item.quantity * item.unit_price
        item_profit = (item.unit_price - cost_price) * item.quantity
        total_amount += item_total
        estimated_profit += item_profit
        processed_items.append({
            "product_id": prod["id"],
            "product_name": prod.get("name", "Product"),
            "quantity": item.quantity,
            "unit_cost": cost_price,
            "unit_price": item.unit_price,
            "total_price": item_total
        })

    payment_status = "PAID"
    if sale.payment_method in ("Credit", "Store Credit") or sale.amount_paid < total_amount:
        payment_status = "PARTIAL" if sale.amount_paid > 0 else "UNPAID"

    sale_id = str(uuid.uuid4())
    sale_record = {
        "id": sale_id,
        "customer_id": sale.customer_id,
        "total_amount": round(total_amount, 2),
        "estimated_profit": round(estimated_profit, 2),
        "payment_method": sale.payment_method,
        "payment_status": payment_status,
        "amount_paid": sale.amount_paid,
        "created_at": datetime.now().isoformat(),
        "items": processed_items
    }

    if not supabase:
        raise HTTPException(status_code=503, detail="Shared database is not configured")

    try:
            # 1. Insert sale header
            sale_header = {k: v for k, v in sale_record.items() if k != "items"}
            supabase.table("sales").insert(sale_header).execute()

            # 2. Insert line items
            for item in processed_items:
                line_item = {
                    "sale_id": sale_id,
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "unit_cost": item["unit_cost"],
                    "unit_price": item["unit_price"],
                    "total_price": item["total_price"]
                }
                supabase.table("sale_items").insert(line_item).execute()

            # 3. Deduct stock & insert stock movement per item
            for item in sale.items:
                target_prod = next((p for p in active_prods if str(p.get("id")) == str(item.product_id) or str(p.get("sku")) == str(item.product_id)), None)
                if target_prod and "id" in target_prod:
                    current_qty = int(target_prod.get("stock_quantity", 0))
                    new_qty = max(0, current_qty - item.quantity)
                    stock_result = supabase.table("products").update({"stock_quantity": new_qty}).eq("id", target_prod["id"]).execute()
                    if not stock_result.data:
                        raise RuntimeError(f"Product stock was not updated for {target_prod['id']}")
                    supabase.table("stock_movements").insert({
                        "id": str(uuid.uuid4()),
                        "product_id": target_prod["id"],
                        "movement_type": "SALE",
                        "quantity": -item.quantity,
                        "reference_id": sale_id,
                        "reason": f"Sale {sale_id[:8]}"
                    }).execute()

            return {"message": "Sale processed and persisted successfully to Supabase", "sale": sale_record}
    except Exception as e:
        print(f"Supabase sale persistence exception: {e}")
        raise HTTPException(status_code=503, detail="Sale could not be saved to the shared database") from e
