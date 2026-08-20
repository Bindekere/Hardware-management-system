from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
_backend_dir = str(Path(__file__).parent.resolve())
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

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

@app.get("/api")
@app.get("/api/")
def api_root():
    return {"message": "HardwareDesk API is live and operational"}

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

def get_file_path(subpath: str):
    candidates = [
        Path(__file__).parent / "dist" / subpath,
        Path(__file__).parent.parent / "dist" / subpath,
        Path(__file__).parent.parent / "frontend" / "dist" / subpath,
    ]
    for c in candidates:
        if c.exists() and c.is_file():
            return c
    return None

@app.get("/assets/{filename}")
def serve_asset(filename: str):
    f = get_file_path(f"assets/{filename}")
    if f:
        media_type = "text/javascript" if filename.endswith(".js") else "text/css" if filename.endswith(".css") else "application/octet-stream"
        return Response(content=f.read_bytes(), media_type=media_type)
    raise HTTPException(status_code=404, detail="Asset not found")

@app.get("/")
@app.get("/index.html")
def serve_index():
    f = get_file_path("index.html")
    if f:
        return HTMLResponse(content=f.read_text(encoding="utf-8"))
    return HTMLResponse("<!DOCTYPE html><html><body><h1>HardwareDesk API Live</h1></body></html>")
