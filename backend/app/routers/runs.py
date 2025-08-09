from fastapi import APIRouter, HTTPException
import time
from ..core.store import STORE
from ..services.analysis import compute_analysis
from ..services.analysis_report import build_markdown_report


router = APIRouter()

# Simple in-memory cache for LLM analysis per run_id
# Structure: { run_id: {"ts": epoch_seconds, "ttl": 3600, "data": json } }
_LLM_ANALYSIS_CACHE: dict[str, dict] = {}


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    run = STORE.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run["run"]


@router.get("/runs/{run_id}/sources")
def get_sources(run_id: str):
    run = STORE.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run["sources"]


@router.get("/runs/{run_id}/claims")
def get_claims(run_id: str):
    run = STORE.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run["claims"]


@router.get("/runs/{run_id}/evidence")
def get_evidence(run_id: str):
    run = STORE.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run["evidence"]


@router.get("/runs/{run_id}/classifications")
def get_classifications(run_id: str):
    run = STORE.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run["classifications"]


@router.get("/runs/{run_id}/trace")
def get_trace(run_id: str):
    run = STORE.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    base = {
        "run": run["run"],
        "sources": run["sources"],
        "claims": run["claims"],
        "evidence": run["evidence"],
        "classifications": run["classifications"],
        "answer": run["answer"],
    }
    if "provider_results" in run:
        base["provider_results"] = run["provider_results"]
    if "fetched_docs" in run:
        base["fetched_docs"] = run["fetched_docs"]
    base["analysis"] = compute_analysis(run)
    return base


@router.get("/runs/{run_id}/report.md")
def get_run_report(run_id: str):
    run = STORE.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    # Ensure we have analysis and llm analysis
    base = {
        "run": run["run"],
        "sources": run["sources"],
        "claims": run["claims"],
        "evidence": run["evidence"],
        "analysis": compute_analysis(run),
    }
    # Generate LLM-based analysis only for report requests (avoid blocking default trace)
    try:
        from ..services.analysis_llm import generate_citation_analysis
        llm = generate_citation_analysis(run)
    except Exception:
        llm = None
    md = build_markdown_report(base, llm)
    return md



@router.post("/runs/{run_id}/llm_citation_analysis")
def generate_llm_analysis_from_bundle(run_id: str, bundle_data: dict):
    """
    Generate LLM analysis from provided bundle data (no re-fetching).
    Frontend already has all the data - just process it.
    """
    try:
        # Serve cached if fresh
        cache = _LLM_ANALYSIS_CACHE.get(run_id)
        now = time.time()
        if cache and (now - cache.get("ts", 0) < cache.get("ttl", 3600)):
            print(f"[CACHE HIT] Serving cached LLM analysis for run {run_id}")
            return cache["data"]

        print(f"[CACHE MISS] Generating new LLM analysis for run {run_id}")
        # Use the provided bundle data directly - no store fetch needed!
        from ..services.analysis_llm import generate_citation_analysis
        start_time = time.time()
        data = generate_citation_analysis(bundle_data)
        generation_time = time.time() - start_time
        print(f"[LLM TIMING] Analysis took {generation_time:.2f} seconds")
        
        if not data:
            return {"ok": False, "reason": "generation_failed"}
        
        # Cache for 60 minutes
        _LLM_ANALYSIS_CACHE[run_id] = {"ts": now, "ttl": 3600, "data": data}
        return data
    except Exception as e:
        print(f"[ERROR] LLM analysis failed: {str(e)}")
        return {"ok": False, "reason": "exception", "message": str(e)}

@router.get("/runs/{run_id}/llm_citation_analysis")
def get_llm_citation_analysis(run_id: str):
    """
    Legacy endpoint - fetches data from store.
    Use POST version with bundle data for better performance.
    """
    try:
        # Serve cached if fresh
        cache = _LLM_ANALYSIS_CACHE.get(run_id)
        now = time.time()
        if cache and (now - cache.get("ts", 0) < cache.get("ttl", 3600)):
            return cache["data"]

        # Fetch run data from store (inefficient)
        run = STORE.get_run(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        from ..services.analysis_llm import generate_citation_analysis
        data = generate_citation_analysis(run)
        if not data:
            return {"ok": False, "reason": "generation_failed"}
        
        _LLM_ANALYSIS_CACHE[run_id] = {"ts": now, "ttl": 3600, "data": data}
        return data
    except Exception as e:
        return {"ok": False, "reason": "exception", "message": str(e)}

