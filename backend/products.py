from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import uuid
from schemas import ProductCreate, ProductUpdate, ProductResponse, StockAdjustmentCreate

router = APIRouter(prefix="/products", tags=["Products"])

# In-memory product store for rapid prototyping/offline dev
PRODUCTS_DB = [
    {
        "id": "prod-1",
        "sku": "CEM-001",
        "barcode": "8901234567890",
        "name": "Portland Cement 50kg",
        "category_id": "Building",
        "supplier_id": "Supplier A",
        "storage_location_id": "A1-S1-B1",
        "unit": "bag",
        "cost_price": 9.50,
        "selling_price": 12.00,
        "stock_quantity": 120,
        "minimum_stock": 20,
        "image_url": "",
        "active": True
    },
    {
        "id": "prod-2",
        "sku": "PVC-002",
        "barcode": "8901234567891",
        "name": "PVC Pipe 2 inch (3m)",
        "category_id": "Plumbing",
        "supplier_id": "Supplier B",
        "storage_location_id": "A2-S3-B1",
        "unit": "pcs",
        "cost_price": 5.00,
        "selling_price": 8.50,
        "stock_quantity": 4,
        "minimum_stock": 10,
        "image_url": "",
        "active": True
    },
    {
        "id": "prod-3",
        "sku": "NAL-003",
        "barcode": "8901234567892",
        "name": "Steel Nails 3 inch (kg)",
        "category_id": "Hardware",
        "supplier_id": "Supplier C",
        "storage_location_id": "A3-S1-B2",
        "unit": "kg",
        "cost_price": 1.50,
        "selling_price": 2.50,
        "stock_quantity": 0,
        "minimum_stock": 15,
        "image_url": "",
        "active": True
    }
]

STOCK_MOVEMENTS_DB = []

@router.get("/", response_model=List[ProductResponse])
def get_products(search: Optional[str] = None, category: Optional[str] = None):
    results = PRODUCTS_DB
    if search:
        s = search.lower()
        results = [
            p for p in results 
            if s in p["name"].lower() or s in p["sku"].lower() or (p["barcode"] and s in p["barcode"])
        ]
    if category:
        results = [p for p in results if p["category_id"] == category]
    return results

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate):
    new_p = product.dict()
    new_p["id"] = str(uuid.uuid4())
    PRODUCTS_DB.append(new_p)
    return new_p

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product_update: ProductUpdate):
    for p in PRODUCTS_DB:
        if p["id"] == product_id:
            update_data = product_update.dict(exclude_unset=True)
            p.update(update_data)
            return p
    raise HTTPException(status_code=404, detail="Product not found")

@router.post("/{product_id}/adjust-stock")
def adjust_stock(product_id: str, adj: StockAdjustmentCreate):
    for p in PRODUCTS_DB:
        if p["id"] == product_id:
            p["stock_quantity"] += adj.quantity
            movement = {
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "movement_type": adj.movement_type,
                "quantity": adj.quantity,
                "reason": adj.reason
            }
            STOCK_MOVEMENTS_DB.append(movement)
            return {"message": "Stock adjusted successfully", "new_stock": p["stock_quantity"]}
    raise HTTPException(status_code=404, detail="Product not found")
