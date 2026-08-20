from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SALES_STAFF = "SALES_STAFF"
    STOREKEEPER = "STOREKEEPER"
    VIEWER = "VIEWER"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True
