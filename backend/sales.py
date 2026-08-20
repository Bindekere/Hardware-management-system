from fastapi import APIRouter, HTTPException
import uuid
from typing import List
from schemas import SaleCreate
from products import PRODUCTS_DB, STOCK_MOVEMENTS_DB

router = APIRouter(prefix="/sales", tags=["Sales"])

SALES_DB = []

@router.get("/")
def get_sales():
    return SALES_DB

@router.post("/")
def process_sale(sale: SaleCreate):
    total_amount = 0.0
    estimated_profit = 0.0
    processed_items = []

    # Validate stock and calculate totals
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

        # Store item snapshot
        processed_items.append({
            "product_id": prod["id"],
            "product_name": prod["name"],
            "quantity": item.quantity,
            "unit_cost": prod["cost_price"],
            "unit_price": item.unit_price,
            "total_price": item_total
        })

    # Perform stock reductions & movement records
    sale_id = str(uuid.uuid4())
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

    payment_status = "PAID"
    if sale.payment_method == "Credit" or sale.amount_paid < total_amount:
        payment_status = "PARTIAL" if sale.amount_paid > 0 else "UNPAID"

    sale_record = {
        "id": sale_id,
        "customer_id": sale.customer_id,
        "total_amount": total_amount,
        "estimated_profit": estimated_profit,
        "payment_method": sale.payment_method,
        "payment_status": payment_status,
        "amount_paid": sale.amount_paid,
        "items": processed_items
    }

    SALES_DB.append(sale_record)
    return {"message": "Sale processed successfully", "sale": sale_record}
