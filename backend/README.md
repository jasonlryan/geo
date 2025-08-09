Backend (FastAPI) — AI Search with Citations Demo

Quick start

- Create a virtualenv (optional) and install deps: `pip install -r requirements.txt`
- Run dev server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- API docs: `http://localhost:8000/docs`

Environment

- Create a `.env` file in `backend/` with:
  - `OPENAI_API_KEY=sk-...`
  - `TAVILY_API_KEY=tvly-...` (enables real web search via Tavily)
  - Optional: `TAVILY_SEARCH_DEPTH=basic|advanced` (default: basic)
  - Optional Redis:
    - `CACHE_BACKEND=redis`
    - `REDIS_URL=redis://localhost:6379/0`
    - `CACHE_TTL_DEFAULT=3600`

Structure

- `app/main.py` — app init & router registration
- `app/routers/search.py` — POST `/api/search/run` to create a run with real search data
- `app/routers/runs.py` — GET endpoints to retrieve run, sources, claims, evidence, trace
- `app/core/store.py` — in-memory run store (swap for DB later)
