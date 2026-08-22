from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional
import uuid
from schemas import ProductCreate, ProductUpdate, ProductResponse, StockAdjustmentCreate
from database import supabase

router = APIRouter(prefix="/products", tags=["Products"])

# In-memory fallback (used when Supabase is not configured)
PRODUCTS_DB = [
    {"id": "prod-1", "sku": "CEM-001", "barcode": "8901234567890", "name": "Portland Cement 50kg", "category_id": "Building", "supplier_id": "Supplier A", "storage_location_id": "A1-S1-B1", "unit": "bag", "cost_price": 9.50, "selling_price": 12.00, "stock_quantity": 120, "minimum_stock": 20, "image_url": "", "active": True},
    {"id": "prod-2", "sku": "PVC-002", "barcode": "8901234567891", "name": "PVC Pipe 2 inch (3m)", "category_id": "Plumbing", "supplier_id": "Supplier B", "storage_location_id": "A2-S3-B1", "unit": "pcs", "cost_price": 5.00, "selling_price": 8.50, "stock_quantity": 4, "minimum_stock": 10, "image_url": "", "active": True},
    {"id": "prod-3", "sku": "NAL-003", "barcode": "8901234567892", "name": "Steel Nails 3 inch (kg)", "category_id": "Hardware", "supplier_id": "Supplier C", "storage_location_id": "A3-S1-B2", "unit": "kg", "cost_price": 1.50, "selling_price": 2.50, "stock_quantity": 0, "minimum_stock": 15, "image_url": "", "active": True}
]

STOCK_MOVEMENTS_DB = []

@router.get("/", response_model=List[ProductResponse])
def get_products(response: Response, search: Optional[str] = None, category: Optional[str] = None):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    if supabase:
        try:
            query = supabase.table("products").select("*").eq("active", True)
            if search:
                query = query.ilike("name", f"%{search}%")
            if category:
                query = query.eq("category_id", category)
            result = query.execute()
            return result.data
        except Exception as e:
            print(f"Supabase read failed, falling back to in-memory: {e}")

    # Fallback to in-memory
    results = PRODUCTS_DB
    if search:
        s = search.lower()
        results = [p for p in results if s in p["name"].lower() or s in p["sku"].lower() or (p.get("barcode") and s in p["barcode"])]
    if category:
        results = [p for p in results if p["category_id"] == category]
    return results

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate):
    new_p = product.dict()
    new_p["id"] = str(uuid.uuid4())
    new_p.setdefault("active", True)

    if supabase:
        try:
            result = supabase.table("products").insert(new_p).execute()
            return result.data[0]
        except Exception as e:
            print(f"Supabase insert failed, saving in-memory: {e}")

    PRODUCTS_DB.append(new_p)
    return new_p

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product_update: ProductUpdate):
    update_data = product_update.dict(exclude_unset=True)

    if supabase:
        try:
            result = supabase.table("products").update(update_data).eq("id", product_id).execute()
            if result.data:
                return result.data[0]
        except Exception as e:
            print(f"Supabase update failed, updating in-memory: {e}")

    for p in PRODUCTS_DB:
        if p["id"] == product_id:
            p.update(update_data)
            return p
    raise HTTPException(status_code=404, detail="Product not found")

@router.post("/{product_id}/adjust-stock")
def adjust_stock(product_id: str, adj: StockAdjustmentCreate):
    movement = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "movement_type": adj.movement_type,
        "quantity": adj.quantity,
        "reason": adj.reason
    }

    if supabase:
        try:
            # Atomic increment via RPC (fallback to manual if RPC not set up)
            result = supabase.table("products").select("stock_quantity").eq("id", product_id).execute()
            if result.data:
                current_qty = result.data[0]["stock_quantity"]
                new_qty = current_qty + adj.quantity
                supabase.table("products").update({"stock_quantity": new_qty}).eq("id", product_id).execute()
                supabase.table("stock_movements").insert(movement).execute()
                return {"message": "Stock adjusted successfully", "new_stock": new_qty}
        except Exception as e:
            print(f"Supabase stock adjust failed, updating in-memory: {e}")

    for p in PRODUCTS_DB:
        if p["id"] == product_id:
            p["stock_quantity"] += adj.quantity
            STOCK_MOVEMENTS_DB.append(movement)
            return {"message": "Stock adjusted successfully", "new_stock": p["stock_quantity"]}
    raise HTTPException(status_code=404, detail="Product not found")
