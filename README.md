# AI Search with Citations — Demo (Scaffold)

This repository contains a minimal scaffold for the product spec in `product_spec.md`.

Contents

- `backend/` — FastAPI service with mocked endpoints and in-memory run store
- `frontend/` — Next.js (App Router, Tailwind) UI with `/search` and `/trace/[runId]`

Getting started

1. Backend

   - `cd backend`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
   - Open `http://localhost:8000/docs`

2. Frontend
   - `cd frontend`
   - `npm install`
   - `cp .env.local.example .env.local` (adjust if needed)
   - `npm run dev` → open `http://localhost:3000`

Notes

- Data is mocked deterministically from the query string; swap `app/services/mock_data.py` with real providers later.
- CORS is open for local dev. Tighten for production.
