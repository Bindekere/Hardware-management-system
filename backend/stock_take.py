from fastapi import APIRouter
import uuid
from schemas import StockCountItemCreate
from products import PRODUCTS_DB, STOCK_MOVEMENTS_DB

router = APIRouter(prefix="/stock-take", tags=["Blind Stock Take"])

STOCK_TAKES_DB = []

@router.post("/submit")
def submit_blind_stock_take(items: list[StockCountItemCreate]):
    audit_results = []
    take_id = str(uuid.uuid4())

    for item in items:
        prod = next((p for p in PRODUCTS_DB if p["id"] == item.product_id), None)
        if prod:
            system_qty = prod["stock_quantity"]
            variance = item.physical_quantity - system_qty
            
            # Apply adjustment
            prod["stock_quantity"] = item.physical_quantity

            # Movement log
            if variance != 0:
                STOCK_MOVEMENTS_DB.append({
                    "id": str(uuid.uuid4()),
                    "product_id": prod["id"],
                    "movement_type": "ADJUSTMENT",
                    "quantity": variance,
                    "reference_id": take_id,
                    "reason": f"Stock Take ({item.reason})"
                })

            audit_results.append({
                "product": prod["name"],
                "system_qty": system_qty,
                "physical_qty": item.physical_quantity,
                "variance": variance,
                "reason": item.reason
            })

    record = {"id": take_id, "results": audit_results}
    STOCK_TAKES_DB.append(record)
    return {"message": "Stock take processed", "summary": record}
