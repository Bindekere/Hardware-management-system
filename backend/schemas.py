from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SALES_STAFF = "SALES_STAFF"
    STOREKEEPER = "STOREKEEPER"
    VIEWER = "VIEWER"

class ProductBase(BaseModel):
    sku: str
    barcode: Optional[str] = None
    name: str
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    storage_location_id: Optional[str] = None
    unit: str = "pcs"
    cost_price: float
    selling_price: float
    stock_quantity: int = 0
    minimum_stock: int = 5
    image_url: Optional[str] = None
    active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    storage_location_id: Optional[str] = None
    unit: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    minimum_stock: Optional[int] = None
    active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StockAdjustmentCreate(BaseModel):
    product_id: str
    quantity: int
    movement_type: str # SALE, PURCHASE, RETURN, DAMAGE, LOSS, THEFT, ADJUSTMENT
    reason: Optional[str] = None
