# HardwareDesk

A simple, fast, professional Hardware Management System.

## Project Structure

- `schema.sql`: PostgreSQL / Supabase database migration schema.
- `backend/`: FastAPI Python server (`main.py`, `requirements.txt`).
- `frontend/`: React + Tailwind CSS dashboard UI.

## Environment Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
