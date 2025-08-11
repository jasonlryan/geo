from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..core.store import STORE
from ..services.search_pipeline import run_search, fetch_top
from ..services.providers.base import ProviderResult
from ..services.composer import compose_answer
from urllib.parse import urlparse
import os
import uuid
import json
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
    subject: str | None = "Executive Search"
    filters: dict | None = None
    force: bool | None = False


class SearchResponse(BaseModel):
    run_id: str


@router.post("/run", response_model=SearchResponse)
def create_run(body: SearchRequest) -> SearchResponse:
    # Attempt provider search first; if empty, fall back to mock demo
    # For now this is synchronous wrapper; can move to background tasks later
    import asyncio

    # Dedupe: if force not set, return last run_id for same query hash
    from ..core.cache import CACHE
    import hashlib
    qhash = hashlib.sha256((body.query.strip().lower() + os.getenv("PIPELINE_VERSION", "1")).encode()).hexdigest()
    if not body.force:
        existing = CACHE.get(CACHE.ai_key(f"query_hash:{qhash}"))
        if existing:
            return SearchResponse(run_id=existing)

    try:
        results_tuple = asyncio.run(run_search(body.query))
    except RuntimeError:
        # If we're already in an event loop (e.g., called from async context), run directly
        results_tuple = asyncio.get_event_loop().run_until_complete(run_search(body.query))

    # Unpack results and provider performance
    results: list[ProviderResult] = results_tuple[0]
    provider_performance = results_tuple[1]

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
                "author": doc.get("author"),
                "publisher": (domain.split(".")[0].title() if domain else None),
                "published_at": doc.get("published_at"),
                "accessed_at": now_iso,
                "media_type": "web",
                "geography": "Unknown",
                "paywall": False,
                # NO HARDCODED CREDIBILITY - TRUE citation selector handles this
                "credibility": {
                    "score": 0.5,  # Neutral - let passage scoring decide
                    "band": "N/A",
                    "rationale": "Content-based scoring in citation selector"
                },
                "content_hash": None,
                "word_count": len((doc.get("raw_text") or "").split()) if doc.get("raw_text") else 0,
                "raw_text": doc.get("raw_text") or "",
                "search_provider": doc.get("search_provider", "unknown"),
                # Reproducibility: extraction method used
                "extraction_method": doc.get("extraction_method", "trafilatura+readability"),
                "extraction_confidence": doc.get("extraction_confidence", 0.8),
                # Multi-provider consensus metadata (if available)
                "discovered_by": doc.get("discovered_by", [doc.get("search_provider", "unknown")]),
                "provider_scores": doc.get("provider_scores", {doc.get("search_provider", "unknown"): 0.5}),
                "consensus_boost": doc.get("consensus_boost", 0.0),
            })

        # Apply content deduplication to remove similar/identical content
        from ..services.content_deduplication import deduplicate_sources, analyze_deduplication_stats
        original_source_count = len(sources)
        sources = deduplicate_sources(sources)
        dedup_stats = analyze_deduplication_stats(sources, sources)  # For logging
        
        if original_source_count != len(sources):
            print(f"[DEDUP] Removed {original_source_count - len(sources)} duplicate sources")

        bundle = {
            "run": {
                "run_id": run_id,
                "query": body.query,
                "subject": body.subject or "Executive Search",
                "created_at": now_iso,
                "params": body.filters or {},
                "timings": {"total_ms": 0},
                "search_model": "Multi-Provider",
                # Reproducibility metadata for research
                "pipeline_version": os.getenv("PIPELINE_VERSION", "v1.2.0"),
                "models": {
                    "composer": os.getenv("OPENAI_MODEL_COMPOSER", "gpt-4o-mini"),
                    "search": os.getenv("OPENAI_MODEL_SEARCH", "gpt-4o-mini"),
                    "analysis": os.getenv("OPENAI_MODEL_ANALYSIS", "gpt-4o-mini")
                },
                "providers_enabled": [r.provider for r in results],
                "authority_floor_enabled": os.getenv("AUTHORITY_FLOOR_ENABLED", "true").lower() == "true",
                "min_authority_sources": int(os.getenv("MIN_AUTHORITY_SOURCES", "2")),
                # TODO: Add git SHA when available
                "git_sha": os.getenv("GIT_SHA", "unknown"),
            },
            "sources": sources,
            "claims": [],
            "evidence": [],
            "classifications": [],
            "answer": {"text": ""},
            "provider_results": [{"title": r.title, "url": r.url, "provider": r.provider} for r in results],
            "fetched_docs": docs,
            "provider_performance": provider_performance,
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
                        "snippet": "",  # Will be filled by alignment
                        "start_offset": 0,  # Will be filled by alignment
                        "end_offset": 0,  # Will be filled by alignment
                    })
            
            # Apply snippet alignment to extract actual quoted passages
            from ..services.snippet_alignment import align_evidence_snippets
            evidence = align_evidence_snippets(claims, sources, evidence)
            
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
                "subject": body.subject or "Executive Search",
                "created_at": now_iso,
                "params": body.filters or {},
                "timings": {"total_ms": 0},
                "search_model": "None",
            },
            "sources": [],
            "claims": [],
            "evidence": [],
            "classifications": [],
            "answer": {"text": "No search results found. Try a different query."},
            "provider_results": [],
            "fetched_docs": [],
        }
    # Persist run bundle (both branches)
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


def get_subject_context(subject: str) -> str:
    """Generate context directly from subject name for random query generation."""
    if not subject or subject.strip() == "":
        return "professional business topics and industry insights"
    
    # Convert subject to lowercase context description
    subject_lower = subject.lower().strip()
    return f"{subject_lower} industry topics, trends, best practices, and professional insights"


@router.get("/random-query")
async def get_random_query(subject: str = "Executive Search"):
    """Generate a random query using OpenAI based on the specified subject."""
    try:
        client = get_openai_client()
        system_prompt = load_random_query_prompt()
        
        # Get subject context dynamically from subject name
        subject_context = get_subject_context(subject)
        
        # Make the prompt dynamic with template substitution
        dynamic_prompt = system_prompt.replace("{SUBJECT_CONTEXT}", subject_context)
        dynamic_prompt = dynamic_prompt.replace("{SUBJECT}", subject)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": dynamic_prompt
                },
                {
                    "role": "user", 
                    "content": f"Generate one random query about {subject}"
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


@router.get("/subjects")
async def get_unique_subjects():
    """Get unique subjects from all runs in Redis."""
    try:
        from ..core.cache import CACHE
        
        # Get all run keys from Redis using the public API
        pattern = CACHE.ai_key("*")
        run_keys = CACHE.keys(pattern)
        
        subjects = set()
        for key in run_keys:
            try:
                # Skip non-run keys (like query hashes, analysis, etc.)
                if any(skip_pattern in key for skip_pattern in ["query_hash:", ":analysis:", ":reports", ":recent", ":q:"]):
                    continue
                    
                bundle = CACHE.get_json(key)
                if bundle and "run" in bundle:
                    subject = bundle["run"].get("subject", "").strip()
                    if subject and subject != "":
                        subjects.add(subject)
            except:
                # Skip invalid keys
                continue
        
        # Return sorted list of unique subjects
        return {"subjects": sorted(list(subjects))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get subjects: {str(e)}")


@router.get("/query-expansion")
async def get_query_expansion(query: str):
    """Get query expansion variants for a given query."""
    try:
        from ..services.search_pipeline import expand_queries
        variants = await expand_queries(query)
        
        return {
            "original_query": query,
            "variants": variants,
            "expansion_count": len(variants) - 1  # Exclude original query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to expand query: {str(e)}")

