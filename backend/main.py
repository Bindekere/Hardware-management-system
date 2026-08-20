from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from products import router as products_router

app = FastAPI(title="HardwareDesk API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(products_router)


@app.get("/")
def read_root():
    return {"message": "HardwareDesk API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
