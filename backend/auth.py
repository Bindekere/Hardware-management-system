from fastapi import APIRouter, HTTPException
from schemas import UserRole

router = APIRouter(prefix="/auth", tags=["Auth"])

# Mock active session user for development
CURRENT_MOCK_USER = {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "admin@hardwaredesk.com",
    "full_name": "Shop Admin",
    "role": UserRole.ADMIN
}

@router.get("/me")
def get_current_user():
    return CURRENT_MOCK_USER

@router.post("/role")
def switch_role(role: UserRole):
    CURRENT_MOCK_USER["role"] = role
    return {"message": f"Role switched to {role.value}", "user": CURRENT_MOCK_USER}
