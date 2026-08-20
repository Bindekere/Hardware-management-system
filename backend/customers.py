from fastapi import APIRouter
import uuid
from schemas import CustomerCreate

router = APIRouter(prefix="/customers", tags=["Customers & Debtors"])

CUSTOMERS_DB = [
    {"id": "cust-1", "name": "John Doe Builders", "phone": "+11223344", "credit_balance": 120.00},
    {"id": "cust-2", "name": "Apex Construction", "phone": "+55667788", "credit_balance": 330.00}
]

@router.get("/")
def get_customers():
    return CUSTOMERS_DB

@router.post("/")
def create_customer(cust: CustomerCreate):
    new_c = cust.dict()
    new_c["id"] = str(uuid.uuid4())
    new_c["credit_balance"] = 0.0
    CUSTOMERS_DB.append(new_c)
    return new_c

@router.post("/{customer_id}/pay-debt")
def pay_customer_debt(customer_id: str, amount: float):
    for c in CUSTOMERS_DB:
        if c["id"] == customer_id:
            c["credit_balance"] = max(0.0, c["credit_balance"] - amount)
            return {"message": "Payment recorded", "remaining_balance": c["credit_balance"]}
    return {"error": "Customer not found"}
