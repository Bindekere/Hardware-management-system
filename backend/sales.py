from fastapi import APIRouter, HTTPException
import uuid
from datetime import datetime
from typing import List
from schemas import SaleCreate
from products import PRODUCTS_DB, STOCK_MOVEMENTS_DB
from database import supabase

router = APIRouter(prefix="/sales", tags=["Sales"])

SALES_DB = []

@router.get("/")
def get_sales():
    if supabase:
        try:
            result = supabase.table("sales").select("*, sale_items(*)").order("created_at", desc=True).execute()
            return result.data
        except Exception as e:
            print(f"Supabase read failed, returning in-memory: {e}")
    return SALES_DB

@router.post("/")
def process_sale(sale: SaleCreate):
    total_amount = 0.0
    estimated_profit = 0.0
    processed_items = []

    # Validate stock and build processed items list
    for item in sale.items:
        prod = next((p for p in PRODUCTS_DB if p["id"] == item.product_id), None)
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} not found")
        if prod["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {prod['name']}")
        item_total = item.quantity * item.unit_price
        item_profit = (item.unit_price - prod["cost_price"]) * item.quantity
        total_amount += item_total
        estimated_profit += item_profit
        processed_items.append({
            "product_id": prod["id"],
            "product_name": prod["name"],
            "quantity": item.quantity,
            "unit_cost": prod["cost_price"],
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

    if supabase:
        try:
            # Insert sale header
            sale_header = {k: v for k, v in sale_record.items() if k != "items"}
            supabase.table("sales").insert(sale_header).execute()

            # Insert line items
            for item in processed_items:
                supabase.table("sale_items").insert({**item, "sale_id": sale_id}).execute()

            # Deduct stock atomically per item
            for item in sale.items:
                prod = next(p for p in PRODUCTS_DB if p["id"] == item.product_id)
                new_qty = prod["stock_quantity"] - item.quantity
                supabase.table("products").update({"stock_quantity": new_qty}).eq("id", item.product_id).execute()
                supabase.table("stock_movements").insert({
                    "id": str(uuid.uuid4()),
                    "product_id": item.product_id,
                    "movement_type": "SALE",
                    "quantity": -item.quantity,
                    "reference_id": sale_id,
                    "reason": f"Sale {sale_id[:8]}"
                }).execute()
                prod["stock_quantity"] = new_qty  # keep local in sync
            return {"message": "Sale processed and persisted successfully", "sale": sale_record}
        except Exception as e:
            print(f"Supabase sale persistence failed, processing in-memory: {e}")

    # In-memory fallback
    for item in sale.items:
        prod = next(p for p in PRODUCTS_DB if p["id"] == item.product_id)
        prod["stock_quantity"] -= item.quantity
        STOCK_MOVEMENTS_DB.append({
            "id": str(uuid.uuid4()),
            "product_id": prod["id"],
            "movement_type": "SALE",
            "quantity": -item.quantity,
            "reference_id": sale_id,
            "reason": f"Sale {sale_id[:8]}"
        })

    SALES_DB.append(sale_record)
    return {"message": "Sale processed successfully", "sale": sale_record}
