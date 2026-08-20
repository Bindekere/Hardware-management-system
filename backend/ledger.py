from fastapi import APIRouter, HTTPException
import uuid
from datetime import datetime
from typing import List
from schemas import CustomerCreate, LedgerPaymentCreate, SupplierCreate
from database import supabase

router = APIRouter(prefix="/ledger", tags=["Debtors & Creditors Ledger"])

# In-memory fallback data
DEBTORS_DB = [
    {"id": "c-1", "name": "John Doe Builders", "phone": "+11223344", "total_credit": 350.00, "amount_paid": 230.00, "balance_due": 120.00, "store_credit": 0.00, "status": "OVERDUE"},
    {"id": "c-2", "name": "Apex Construction", "phone": "+55667788", "total_credit": 500.00, "amount_paid": 170.00, "balance_due": 330.00, "store_credit": 0.00, "status": "PENDING"},
    {"id": "c-3", "name": "Samuel Miller", "phone": "+77889900", "total_credit": 0.00, "amount_paid": 250.00, "balance_due": 0.00, "store_credit": 150.00, "status": "STORE CREDIT"}
]

CREDITORS_DB = [
    {"id": "s-1", "name": "Plumbing World", "phone": "+987654321", "total_purchased": 600.00, "amount_paid": 450.00, "balance_due": 150.00, "status": "PENDING"},
    {"id": "s-2", "name": "BuildPro Supplies", "phone": "+123456789", "total_purchased": 1200.00, "amount_paid": 1200.00, "balance_due": 0.00, "status": "CLEARED"}
]

RECEIPTS_DB = []
LEDGER_TRANSACTIONS_DB = {}  # { entity_id: [transaction, ...] }

def _add_transaction(entity_id: str, tx: dict):
    if entity_id not in LEDGER_TRANSACTIONS_DB:
        LEDGER_TRANSACTIONS_DB[entity_id] = []
    LEDGER_TRANSACTIONS_DB[entity_id].insert(0, tx)

@router.get("/debtors")
def get_debtors():
    if supabase:
        try:
            result = supabase.table("customers").select("*").in_("status", ["PENDING", "OVERDUE", "STORE CREDIT", "CLEARED"]).execute()
            return result.data
        except Exception as e:
            print(f"Supabase debtors read failed: {e}")
    return DEBTORS_DB

@router.get("/creditors")
def get_creditors():
    if supabase:
        try:
            result = supabase.table("suppliers").select("*").execute()
            return result.data
        except Exception as e:
            print(f"Supabase creditors read failed: {e}")
    return CREDITORS_DB

@router.get("/receipts")
def get_receipts():
    if supabase:
        try:
            result = supabase.table("receipts").select("*").order("created_at", desc=True).execute()
            return result.data
        except Exception as e:
            print(f"Supabase receipts read failed: {e}")
    return RECEIPTS_DB

@router.get("/transactions/{entity_id}")
def get_entity_transactions(entity_id: str):
    """Return full transaction history for a debtor or creditor."""
    if supabase:
        try:
            result = supabase.table("ledger_transactions").select("*").eq("entity_id", entity_id).order("created_at", desc=True).execute()
            return result.data
        except Exception as e:
            print(f"Supabase transactions read failed: {e}")
    return LEDGER_TRANSACTIONS_DB.get(entity_id, [])

@router.post("/entry")
def add_ledger_entry(entry: CustomerCreate):
    val = entry.amount
    rec = None
    receipt = None

    if entry.type == "DEBTOR":
        rec = {"id": f"c-{uuid.uuid4()}", "name": entry.name, "phone": entry.phone or "", "total_credit": val, "amount_paid": 0.0, "balance_due": val, "store_credit": 0.0, "status": "PENDING"}
        if supabase:
            try:
                supabase.table("customers").insert(rec).execute()
            except Exception as e:
                print(f"Supabase debtor insert failed: {e}")
        DEBTORS_DB.append(rec)
        _add_transaction(rec["id"], {"type": "CREDIT_EXTENDED", "amount": val, "timestamp": datetime.now().isoformat(), "note": "Debtor account opened"})
        return {"message": "Debtor added", "entry": rec}

    elif entry.type == "PREPAYMENT":
        rec = {"id": f"c-{uuid.uuid4()}", "name": entry.name, "phone": entry.phone or "", "total_credit": 0.0, "amount_paid": val, "balance_due": 0.0, "store_credit": val, "status": "STORE CREDIT"}
        receipt = {
            "id": f"REC-PREPAY-{str(uuid.uuid4())[:6].upper()}",
            "type_label": "Customer Prepayment / Store Credit",
            "customer_name": entry.name,
            "timestamp": datetime.now().isoformat(),
            "payment_method": "Cash",
            "total": val,
            "items": [{"name": "Store Credit Deposit", "quantity": 1, "selling_price": val}]
        }
        if supabase:
            try:
                supabase.table("customers").insert(rec).execute()
                supabase.table("receipts").insert(receipt).execute()
            except Exception as e:
                print(f"Supabase prepayment insert failed: {e}")
        DEBTORS_DB.append(rec)
        RECEIPTS_DB.insert(0, receipt)
        _add_transaction(rec["id"], {"type": "PREPAYMENT", "amount": val, "timestamp": datetime.now().isoformat(), "note": "Store credit deposit"})
        return {"message": "Prepayment added", "entry": rec, "receipt": receipt}

    elif entry.type == "CREDITOR":
        rec = {"id": f"s-{uuid.uuid4()}", "name": entry.name, "phone": entry.phone or "", "total_purchased": val, "amount_paid": 0.0, "balance_due": val, "status": "PENDING"}
        if supabase:
            try:
                supabase.table("suppliers").insert(rec).execute()
            except Exception as e:
                print(f"Supabase creditor insert failed: {e}")
        CREDITORS_DB.append(rec)
        _add_transaction(rec["id"], {"type": "PURCHASE_ON_CREDIT", "amount": val, "timestamp": datetime.now().isoformat(), "note": "Creditor account opened"})
        return {"message": "Creditor added", "entry": rec}

    raise HTTPException(status_code=400, detail="Invalid entry type. Use DEBTOR, PREPAYMENT, or CREDITOR.")

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
        if supabase:
            try:
                supabase.table("customers").update({"amount_paid": target["amount_paid"], "balance_due": new_bal, "status": target["status"]}).eq("id", payment.entity_id).execute()
                supabase.table("receipts").insert(receipt).execute()
            except Exception as e:
                print(f"Supabase debtor payment update failed: {e}")
        RECEIPTS_DB.insert(0, receipt)
        _add_transaction(payment.entity_id, {"type": "PAYMENT_RECEIVED", "amount": pay, "payment_method": payment.payment_method, "timestamp": datetime.now().isoformat(), "balance_after": new_bal})
        return {"message": "Payment recorded", "entry": target, "receipt": receipt}

    else:  # CREDITOR
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
        if supabase:
            try:
                supabase.table("suppliers").update({"amount_paid": target["amount_paid"], "balance_due": new_bal, "status": target["status"]}).eq("id", payment.entity_id).execute()
                supabase.table("receipts").insert(receipt).execute()
            except Exception as e:
                print(f"Supabase creditor payment update failed: {e}")
        RECEIPTS_DB.insert(0, receipt)
        _add_transaction(payment.entity_id, {"type": "PAYMENT_MADE", "amount": pay, "payment_method": payment.payment_method, "timestamp": datetime.now().isoformat(), "balance_after": new_bal})
        return {"message": "Payment recorded", "entry": target, "receipt": receipt}
