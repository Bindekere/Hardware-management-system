from fastapi import APIRouter, HTTPException
import uuid
from schemas import SupplierCreate, PurchaseCreate
from products import PRODUCTS_DB, STOCK_MOVEMENTS_DB

router = APIRouter(prefix="/purchases", tags=["Purchases & Suppliers"])

SUPPLIERS_DB = [
  {"id": "sup-1", "name": "BuildPro Supplies", "phone": "+123456789", "email": "info@buildpro.com", "balance": 0.0},
  {"id": "sup-2", "name": "Plumbing World", "phone": "+987654321", "email": "sales@pworld.com", "balance": 150.0}
]

PURCHASES_DB = []

@router.get("/suppliers")
def get_suppliers():
    return SUPPLIERS_DB

@router.post("/suppliers")
def create_supplier(sup: SupplierCreate):
    new_sup = sup.dict()
    new_sup["id"] = str(uuid.uuid4())
    new_sup["balance"] = 0.0
    SUPPLIERS_DB.append(new_sup)
    return new_sup

@router.get("/")
def get_purchases():
    return PURCHASES_DB

@router.post("/")
def process_purchase(pur: PurchaseCreate):
    supplier = next((s for s in SUPPLIERS_DB if s["id"] == pur.supplier_id), None)
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")

    total_amount = sum(i.quantity * i.unit_cost for i in pur.items)
    unpaid_balance = total_amount - pur.amount_paid
    supplier["balance"] += unpaid_balance

    purchase_id = str(uuid.uuid4())

    for item in pur.items:
        prod = next((p for p in PRODUCTS_DB if p["id"] == item.product_id), None)
        if prod:
            prod["stock_quantity"] += item.quantity
            prod["cost_price"] = item.unit_cost # update cost price
            STOCK_MOVEMENTS_DB.append({
                "id": str(uuid.uuid4()),
                "product_id": prod["id"],
                "movement_type": "PURCHASE",
                "quantity": item.quantity,
                "reference_id": purchase_id,
                "reason": f"Purchase {purchase_id[:8]}"
            })

    record = {
        "id": purchase_id,
        "supplier_id": pur.supplier_id,
        "supplier_name": supplier["name"],
        "total_amount": total_amount,
        "amount_paid": pur.amount_paid,
        "unpaid_balance": unpaid_balance
    }
    PURCHASES_DB.append(record)
    return {"message": "Purchase recorded successfully", "purchase": record}
