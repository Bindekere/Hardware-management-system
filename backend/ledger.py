from fastapi import APIRouter, HTTPException
import uuid
from datetime import datetime
from typing import List
from schemas import CustomerCreate, LedgerPaymentCreate, SupplierCreate

router = APIRouter(prefix="/ledger", tags=["Debtors & Creditors Ledger"])

DEBTORS_DB = [
    { "id": "c-1", "name": "John Doe Builders", "phone": "+11223344", "total_credit": 350.00, "amount_paid": 230.00, "balance_due": 120.00, "store_credit": 0.00, "status": "OVERDUE" },
    { "id": "c-2", "name": "Apex Construction", "phone": "+55667788", "total_credit": 500.00, "amount_paid": 170.00, "balance_due": 330.00, "store_credit": 0.00, "status": "PENDING" },
    { "id": "c-3", "name": "Samuel Miller", "phone": "+77889900", "total_credit": 0.00, "amount_paid": 250.00, "balance_due": 0.00, "store_credit": 150.00, "status": "STORE CREDIT" }
]

CREDITORS_DB = [
    { "id": "s-1", "name": "Plumbing World", "phone": "+987654321", "total_purchased": 600.00, "amount_paid": 450.00, "balance_due": 150.00, "status": "PENDING" },
    { "id": "s-2", "name": "BuildPro Supplies", "phone": "+123456789", "total_purchased": 1200.00, "amount_paid": 1200.00, "balance_due": 0.00, "status": "CLEARED" }
]

RECEIPTS_DB = []

@router.get("/debtors")
def get_debtors():
    return DEBTORS_DB

@router.get("/creditors")
def get_creditors():
    return CREDITORS_DB

@router.get("/receipts")
def get_receipts():
    return RECEIPTS_DB

@router.post("/entry")
def add_ledger_entry(entry: CustomerCreate):
    val = entry.amount
    if entry.type == "DEBTOR":
        rec = {
            "id": f"c-{uuid.uuid4()}",
            "name": entry.name,
            "phone": entry.phone or "",
            "total_credit": val,
            "amount_paid": 0.0,
            "balance_due": val,
            "store_credit": 0.0,
            "status": "PENDING"
        }
        DEBTORS_DB.append(rec)
        return {"message": "Debtor added", "entry": rec}

    elif entry.type == "PREPAYMENT":
        rec = {
            "id": f"c-{uuid.uuid4()}",
            "name": entry.name,
            "phone": entry.phone or "",
            "total_credit": 0.0,
            "amount_paid": val,
            "balance_due": 0.0,
            "store_credit": val,
            "status": "STORE CREDIT"
        }
        DEBTORS_DB.append(rec)

        receipt = {
            "id": f"REC-PREPAY-{str(uuid.uuid4())[:6].upper()}",
            "type_label": "Customer Prepayment / Store Credit",
            "customer_name": entry.name,
            "timestamp": datetime.now().isoformat(),
            "payment_method": "Cash",
            "total": val,
            "items": [{"name": "Store Credit Deposit", "quantity": 1, "selling_price": val}]
        }
        RECEIPTS_DB.insert(0, receipt)
        return {"message": "Prepayment added", "entry": rec, "receipt": receipt}

    elif entry.type == "CREDITOR":
        rec = {
            "id": f"s-{uuid.uuid4()}",
            "name": entry.name,
            "phone": entry.phone or "",
            "total_purchased": val,
            "amount_paid": 0.0,
            "balance_due": val,
            "status": "PENDING"
        }
        CREDITORS_DB.append(rec)
        return {"message": "Creditor added", "entry": rec}

@router.post("/payment")
def record_ledger_payment(payment: LedgerPaymentCreate):
    pay = payment.amount
    if payment.entity_type == "DEBTOR":
        target = next((d for d in DEBTORS_DB if d["id"] == payment.entity_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="Debtor not found")
        new_bal = max(0.0, target["balance_due"] - pay)
        target["amount_paid"] += pay
        target["balance_due"] = new_bal
        if new_bal == 0:
            target["status"] = "CLEARED"

        receipt = {
            "id": f"REC-DEBT-PAY-{str(uuid.uuid4())[:6].upper()}",
            "type_label": "Debtor Balance Payment",
            "customer_name": target["name"],
            "timestamp": datetime.now().isoformat(),
            "payment_method": payment.payment_method,
            "total": pay,
            "items": [{"name": f"Debtor Payment for {target['name']}", "quantity": 1, "selling_price": pay}]
        }
        RECEIPTS_DB.insert(0, receipt)
        return {"message": "Payment recorded", "entry": target, "receipt": receipt}
    else:
        target = next((c for c in CREDITORS_DB if c["id"] == payment.entity_id), None)
        if not target:
            raise HTTPException(status_code=404, detail="Creditor not found")
        new_bal = max(0.0, target["balance_due"] - pay)
        target["amount_paid"] += pay
        target["balance_due"] = new_bal
        if new_bal == 0:
            target["status"] = "CLEARED"

        receipt = {
            "id": f"REC-SUP-PAY-{str(uuid.uuid4())[:6].upper()}",
            "type_label": "Supplier Creditor Payment",
            "customer_name": target["name"],
            "timestamp": datetime.now().isoformat(),
            "payment_method": payment.payment_method,
            "total": pay,
            "items": [{"name": f"Supplier Payment to {target['name']}", "quantity": 1, "selling_price": pay}]
        }
        RECEIPTS_DB.insert(0, receipt)
        return {"message": "Payment recorded", "entry": target, "receipt": receipt}
