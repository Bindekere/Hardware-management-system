from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from auth import router as auth_router
from products import router as products_router
from sales import router as sales_router
from purchases import router as purchases_router
from customers import router as customers_router
from stock_take import router as stock_take_router
from reports import router as reports_router
from ledger import router as ledger_router

app = FastAPI(title="HardwareDesk API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers at root
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(sales_router)
app.include_router(purchases_router)
app.include_router(customers_router)
app.include_router(stock_take_router)
app.include_router(reports_router)
app.include_router(ledger_router)

# Also include routers under /api prefix for Vercel Serverless Function routing
app.include_router(auth_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(purchases_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(stock_take_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(ledger_router, prefix="/api")

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# Find built frontend index.html
def get_index_path():
    candidates = [
        Path(__file__).parent.parent / "frontend" / "dist" / "index.html",
        Path(__file__).parent.parent / "dist" / "index.html",
        Path(__file__).parent / "dist" / "index.html",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None

# Find assets folder
def get_assets_path():
    candidates = [
        Path(__file__).parent.parent / "frontend" / "dist" / "assets",
        Path(__file__).parent.parent / "dist" / "assets",
        Path(__file__).parent / "dist" / "assets",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None

assets_dir = get_assets_path()
if assets_dir:
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

@app.get("/")
@app.get("/api")
@app.get("/index.html")
@app.get("/api/index.py")
def serve_root():
    p = get_index_path()
    if p:
        return FileResponse(str(p))
    return {"message": "HardwareDesk API is live"}
