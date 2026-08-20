from fastapi import APIRouter
from products import PRODUCTS_DB
from sales import SALES_DB
from purchases import PURCHASES_DB
from customers import CUSTOMERS_DB

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_reports_summary():
    total_sales = sum(s["total_amount"] for s in SALES_DB)
    total_profit = sum(s["estimated_profit"] for s in SALES_DB)
    total_purchases = sum(p["total_amount"] for p in PURCHASES_DB)
    total_customer_debts = sum(c["credit_balance"] for c in CUSTOMERS_DB)
    
    stock_value = sum(p["stock_quantity"] * p["cost_price"] for p in PRODUCTS_DB)
    low_stock_count = len([p for p in PRODUCTS_DB if p["stock_quantity"] <= p["minimum_stock"]])

    return {
        "total_sales": total_sales,
        "estimated_gross_profit": total_profit,
        "total_purchases": total_purchases,
        "total_customer_debts": total_customer_debts,
        "stock_value": stock_value,
        "low_stock_count": low_stock_count
    }
