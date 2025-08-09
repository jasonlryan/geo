from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import search, runs
from dotenv import load_dotenv
from .core.db import init_db
import os

# Load environment variables from the root .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
init_db()

app = FastAPI(title="AI Search with Citations — Demo API")

# Allow local dev from Next.js
origins = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/search", tags=["search"]) 
app.include_router(runs.router, prefix="/api", tags=["runs"]) 

@app.get("/")
def root():
    return {"ok": True, "service": "demo-api"}

