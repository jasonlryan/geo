from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..core.store import STORE
from ..services.search_pipeline import run_search, fetch_top
from ..services.providers.base import ProviderResult
from ..services.composer import compose_answer
from urllib.parse import urlparse
import uuid
from datetime import datetime
import os
from openai import OpenAI


router = APIRouter()

def get_openai_client():
    """Get OpenAI client with API key from environment."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return OpenAI(api_key=api_key)


class SearchRequest(BaseModel):
    query: str
    filters: dict | None = None


class SearchResponse(BaseModel):
    run_id: str


@router.post("/run", response_model=SearchResponse)
def create_run(body: SearchRequest) -> SearchResponse:
    # Attempt provider search first; if empty, fall back to mock demo
    # For now this is synchronous wrapper; can move to background tasks later
    import asyncio

    try:
        results: list[ProviderResult] = asyncio.run(run_search(body.query))
    except RuntimeError:
        # If we're already in an event loop (e.g., called from async context), run directly
        results = asyncio.get_event_loop().run_until_complete(run_search(body.query))

    if results:
        # Fetch top pages and build minimal real-only bundle
        try:
            docs = asyncio.run(fetch_top(results))
        except RuntimeError:
            docs = asyncio.get_event_loop().run_until_complete(fetch_top(results))

        now_iso = datetime.utcnow().isoformat() + "Z"
        run_id = str(uuid.uuid4())
        sources = []
        for i, doc in enumerate(docs):
            parsed = urlparse(doc.get("url") or "")
            domain = parsed.hostname or ""
            src_id = f"src_{i+1:02d}_{str(uuid.uuid4())[:8]}"
            sources.append({
                "source_id": src_id,
                "run_id": run_id,
                "url": doc.get("url"),
                "canonical_url": doc.get("url"),
                "domain": domain,
                "title": doc.get("title") or doc.get("url"),
                "author": None,
                "publisher": (domain.split(".")[0].title() if domain else None),
                "published_at": doc.get("published_at"),
                "accessed_at": now_iso,
                "media_type": "web",
                "geography": "Unknown",
                "paywall": False,
                "credibility": {"score": 0.6, "rationale": "default"},
                "content_hash": None,
                "word_count": None,
                "raw_text": doc.get("raw_text") or "",
            })

        bundle = {
            "run": {
                "run_id": run_id,
                "query": body.query,
                "created_at": now_iso,
                "params": body.filters or {},
                "timings": {"total_ms": 0},
            },
            "sources": sources,
            "claims": [],
            "evidence": [],
            "classifications": [],
            "answer": {"text": ""},
            "provider_results": [{"title": r.title, "url": r.url, "provider": r.provider} for r in results],
            "fetched_docs": docs,
        }

        if sources:
            composed = compose_answer(body.query, sources)
            bundle["answer"]["text"] = composed.get("answer_text") or ""
            sentences = composed.get("sentences") or []
            claims = []
            evidence = []
            for idx, sent in enumerate(sentences):
                claim_id = f"c{idx+1}_{str(uuid.uuid4())[:8]}"
                claims.append({
                    "claim_id": claim_id,
                    "run_id": run_id,
                    "text": sent.get("text") or "",
                    "importance": 0.7,
                    "answer_sentence_index": idx,
                })
                for sid in sent.get("source_ids", []):
                    evidence.append({
                        "claim_id": claim_id,
                        "source_id": sid,
                        "coverage_score": 0.6,
                        "stance": "supports",
                        "snippet": "",
                        "start_offset": 0,
                        "end_offset": 0,
                    })
            bundle["claims"] = claims
            bundle["evidence"] = evidence
        # Return real bundle with actual data
        final_bundle = bundle
    else:
        # No provider results. Return empty bundle - no fake data.
        now_iso = datetime.utcnow().isoformat() + "Z"
        run_id = str(uuid.uuid4())
        final_bundle = {
            "run": {
                "run_id": run_id,
                "query": body.query,
                "created_at": now_iso,
                "params": body.filters or {},
                "timings": {"total_ms": 0},
            },
            "sources": [],
            "claims": [],
            "evidence": [],
            "classifications": [],
            "answer": {"text": "No search results found. Try a different query."},
            "provider_results": [],
            "fetched_docs": [],
        }

    run_id = STORE.create_run(final_bundle)
    return SearchResponse(run_id=run_id)


def load_random_query_prompt():
    """Load the random query generation prompt from file."""
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "..", "prompts", "random_query.md")
    with open(prompt_path, "r") as f:
        content = f.read().strip()
    
    # Extract system prompt (everything after "SYSTEM")
    if content.startswith("SYSTEM"):
        return content[6:].strip()
    return content


@router.get("/random-query")
async def get_random_query():
    """Generate a random query using OpenAI focused on executive search, leadership, and organizational consulting."""
    try:
        client = get_openai_client()
        system_prompt = load_random_query_prompt()
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": "Generate one random query"
                }
            ],
            max_tokens=100,
            temperature=0.9
        )
        query = response.choices[0].message.content.strip()
        return {"query": query}
    except Exception as e:
        # Return error if OpenAI fails
        raise HTTPException(status_code=500, detail=f"Failed to generate random query: {str(e)}")

