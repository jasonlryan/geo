from fastapi import APIRouter, HTTPException
from datetime import datetime
import time
from ..core.store import STORE
from ..services.analysis import compute_analysis
from ..services.analysis_report import build_markdown_report
from ..core.cache import CACHE


router = APIRouter()

# Prefer Redis-backed cache; fall back to in-memory
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
        # Try Redis cache first
        redis_cached = CACHE.get_json(CACHE.ai_key(f"analysis:{run_id}"))
        if redis_cached:
            print(f"[CACHE HIT][redis] LLM analysis {run_id}")
            return redis_cached

        # Fallback to in-memory cache
        cache = _LLM_ANALYSIS_CACHE.get(run_id)
        now = time.time()
        if cache and (now - cache.get("ts", 0) < cache.get("ttl", 3600)):
            print(f"[CACHE HIT][mem] LLM analysis {run_id}")
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
        
        # Cache for 24 hours with metadata (Redis + mem fallback)
        try:
            # Get run data for metadata
            run_data = bundle_data.get("run", {})
            enriched_data = {
                **data,
                "metadata": {
                    "run_id": run_id,
                    "query": run_data.get("query", ""),
                    "search_model": run_data.get("search_model", "Unknown"),
                    "created_at": run_data.get("created_at", ""),
                    "generated_at": datetime.utcnow().isoformat() + "Z"
                }
            }
            CACHE.set_json(CACHE.ai_key(f"analysis:{run_id}"), enriched_data)  # Permanent storage for intelligence reports
            # Add to reports index for easy retrieval - permanent
            CACHE.zadd(CACHE.ai_key("reports"), score=datetime.utcnow().timestamp(), member=run_id)
        except Exception:
            pass
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
        # Redis cache first
        redis_cached = CACHE.get_json(CACHE.ai_key(f"analysis:{run_id}"))
        if redis_cached:
            return redis_cached

        # Mem fallback
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
        
        try:
            # Store permanently for marketing intelligence
            CACHE.set_json(CACHE.ai_key(f"analysis:{run_id}"), data)
            # Add to reports index
            CACHE.zadd(CACHE.ai_key("reports"), score=datetime.utcnow().timestamp(), member=run_id)
        except Exception:
            pass
        _LLM_ANALYSIS_CACHE[run_id] = {"ts": now, "ttl": 3600, "data": data}
        return data
    except Exception as e:
        return {"ok": False, "reason": "exception", "message": str(e)}


@router.get("/debug/redis-keys")
def debug_redis_keys():
    try:
        keys = sorted(CACHE.keys(f"{CACHE.ai_prefix()}:*"))
        sample = []
        for k in keys[:50]:
            sample.append({
                "key": k,
                "ttl": CACHE.ttl(k),
            })
        return {"count": len(keys), "sample": sample}
    except Exception as e:
        return {"ok": False, "message": str(e)}


@router.get("/insights/recent")
def insights_recent(limit: int = 20, subject: str = None):
    """Return recent run_ids with timestamps from the versioned ZSET."""
    key = CACHE.ai_key("recent")
    items = CACHE.zrevrange_withscores(key, 0, max(0, limit - 1))
    
    # Filter by subject if provided
    filtered_items = []
    for run_id, ts in items:
        if subject:
            bundle = CACHE.get_json(CACHE.ai_key(f"{run_id}"))
            if bundle and bundle.get("run", {}).get("subject") == subject:
                filtered_items.append({"run_id": run_id, "ts": ts})
        else:
            filtered_items.append({"run_id": run_id, "ts": ts})
    
    return {"items": filtered_items}


@router.get("/insights/query/{qhash}")
def insights_query(qhash: str, limit: int = 20):
    """Return recent run_ids for a given query hash list."""
    key = CACHE.ai_key(f"q:{qhash}")
    items = CACHE.lrange(key, 0, max(0, limit - 1))
    return {"items": items}


@router.get("/insights/reports")
def insights_reports(limit: int = 20):
    """Return recent intelligence reports with metadata."""
    try:
        # Get recent reports from index
        reports_index = CACHE.zrevrange_withscores(CACHE.ai_key("reports"), 0, max(0, limit - 1))
        reports = []
        
        for run_id, timestamp in reports_index:
            # Get the analysis data
            analysis = CACHE.get_json(CACHE.ai_key(f"analysis:{run_id}"))
            if analysis and "metadata" in analysis:
                metadata = analysis["metadata"]
                reports.append({
                    "run_id": run_id,
                    "query": metadata.get("query", ""),
                    "search_model": metadata.get("search_model", "Unknown"),
                    "created_at": metadata.get("created_at", ""),
                    "generated_at": metadata.get("generated_at", ""),
                    "has_analysis": bool(analysis.get("analysis") or analysis.get("classifications"))
                })
        
        return {"reports": reports}
    except Exception as e:
        return {"reports": [], "error": str(e)}


@router.get("/insights/subjects")
def insights_subjects():
    """Return available subjects from stored runs."""
    recent = CACHE.zrevrange_withscores(CACHE.ai_key("recent"), 0, -1)
    run_ids = [m for m, _ in recent]
    subjects = set()
    
    for run_id in run_ids:
        bundle = CACHE.get_json(CACHE.ai_key(f"{run_id}"))
        if bundle:
            subject = bundle.get("run", {}).get("subject")
            if subject:
                subjects.add(subject)
    
    return {"subjects": sorted(list(subjects))}


@router.get("/insights/aggregate")
def insights_aggregate(limit: int = 50, subject: str = None):
    """Aggregate patterns across recent runs from Redis bundles.

    Returns:
        - runs: number of runs included
        - totals: total_sources, total_cited_sources, avg_citation_rate
        - domains_top: list[[domain, citations]] sorted desc
        - source_categories: dict[category, count] of cited sources by category
    """
    recent = CACHE.zrevrange_withscores(CACHE.ai_key("recent"), 0, max(0, limit - 1))
    run_ids = [m for m, _ in recent]
    total_sources = 0
    total_cited_sources = 0
    domain_citations: dict[str, int] = {}
    category_citations: dict[str, int] = {}
    domains_by_category: dict[str, list] = {}  # Store actual cited articles by category
    runs_counted = 0

    for run_id in run_ids:
        bundle = CACHE.get_json(CACHE.ai_key(f"{run_id}"))
        if not bundle:
            continue
        
        # Filter by subject if provided
        if subject:
            bundle_subject = bundle.get("run", {}).get("subject")
            if bundle_subject != subject:
                continue
        
        runs_counted += 1
        sources = bundle.get("sources", [])
        evidence = bundle.get("evidence", [])
        total_sources += len(sources)
        cited_ids = {e.get("source_id") for e in evidence if e.get("source_id")}
        total_cited_sources += len(cited_ids)
        # Count domains and categories for cited sources only
        src_by_id = {s.get("source_id"): s for s in sources}
        for sid in cited_ids:
            s = src_by_id.get(sid)
            if not s:
                continue
            # Domain counting
            domain = (s.get("domain") or "").lower()
            category = s.get("category", "web")
            
            if domain:
                url = s.get("url", "")
                title = s.get("title", domain)
                domain_citations[domain] = domain_citations.get(domain, 0) + 1
                
                # Store actual cited articles by category
                if category not in domains_by_category:
                    domains_by_category[category] = []
                
                # Add this specific cited article
                domains_by_category[category].append({
                    "domain": domain,
                    "url": url,
                    "title": title,
                    "source_id": s.get("source_id")
                })
            
            # Category counting
            category_citations[category] = category_citations.get(category, 0) + 1

    avg_citation_rate = 0.0
    if total_sources > 0:
        avg_citation_rate = (total_cited_sources / total_sources) if runs_counted > 0 else 0.0

    domains_top = sorted(domain_citations.items(), key=lambda x: x[1], reverse=True)[:20]
    categories_sorted = sorted(category_citations.items(), key=lambda x: x[1], reverse=True)
    
    # Group and sort articles by domain within each category
    domains_by_category_sorted = {}
    for category, articles in domains_by_category.items():
        # Group articles by domain
        domain_groups = {}
        for article in articles:
            domain = article["domain"]
            if domain not in domain_groups:
                domain_groups[domain] = []
            domain_groups[domain].append(article)
        
        # Sort domains by article count, then sort articles within each domain
        sorted_domains = []
        for domain, domain_articles in sorted(domain_groups.items(), key=lambda x: len(x[1]), reverse=True):
            sorted_articles = sorted(domain_articles, key=lambda x: x["title"])
            sorted_domains.append([domain, sorted_articles])
        
        domains_by_category_sorted[category] = sorted_domains

    return {
        "runs": runs_counted,
        "totals": {
            "total_sources": total_sources,
            "total_cited_sources": total_cited_sources,
            "avg_citation_rate": round(avg_citation_rate, 4),
        },
        "domains_top": domains_top,
        "source_categories": dict(categories_sorted),
        "domains_by_category": domains_by_category_sorted,
    }


@router.post("/insights/migrate_legacy")
def migrate_legacy(dry_run: bool = True, limit: int = 1000):
    """Copy legacy, un-versioned ai_search:* keys into versioned namespace.

    - ai_search:{run_id}                → ai_search:v{ver}:{run_id}
    - ai_search:analysis:{run_id}       → ai_search:v{ver}:analysis:{run_id}
    - ai_search:query_hash:{hash}       → ai_search:v{ver}:query_hash:{hash}
    Also rebuild indices:
      - recent ZSET with run created_at when available
      - q:{hash} LIST with run_id
    """
    ver_prefix = CACHE.ai_prefix()
    legacy_keys = [k for k in CACHE.keys("ai_search:*") if not k.startswith(f"{ver_prefix}:")]
    migrated = {"bundles": 0, "analysis": 0, "qhash": 0}
    for k in legacy_keys[:limit]:
        try:
            if k.startswith("ai_search:analysis:"):
                run_id = k.split(":", 2)[2]
                data = CACHE.get_json(k)
                if not data:
                    continue
                if not dry_run:
                    ttl = CACHE.ttl(k) or 3600
                    CACHE.set_json(CACHE.ai_key(f"analysis:{run_id}"), data, ttl=ttl)
                migrated["analysis"] += 1
                continue
            if k.startswith("ai_search:query_hash:"):
                h = k.split(":", 2)[2]
                run_id = CACHE.get(k)
                if not run_id:
                    continue
                if not dry_run:
                    ttl = CACHE.ttl(k) or 30 * 60
                    CACHE.set(CACHE.ai_key(f"query_hash:{h}"), run_id, ttl=ttl)
                    # Append to query history list
                    CACHE.lpush(CACHE.ai_key(f"q:{h}"), run_id, ttl=7 * 24 * 3600)
                    CACHE.ltrim(CACHE.ai_key(f"q:{h}"), 20)
                migrated["qhash"] += 1
                continue
            # Otherwise treat as bundle key for run
            if k.startswith("ai_search:"):
                run_id = k.split(":", 1)[1]
                bundle = CACHE.get_json(k)
                if not bundle:
                    continue
                if not dry_run:
                    ttl = CACHE.ttl(k) or 24 * 3600
                    CACHE.set_json(CACHE.ai_key(f"{run_id}"), bundle, ttl=ttl)
                    # Index recent by created_at if present
                    created_at = (bundle.get("run") or {}).get("created_at")
                    ts = None
                    if isinstance(created_at, str):
                        try:
                            iso = created_at[:-1] if created_at.endswith("Z") else created_at
                            ts = datetime.fromisoformat(iso).timestamp()
                        except Exception:
                            ts = None
                    if ts is None:
                        ts = datetime.utcnow().timestamp()
                    CACHE.zadd(CACHE.ai_key("recent"), score=ts, member=run_id, ttl=7 * 24 * 3600)
                migrated["bundles"] += 1
        except Exception:
            # continue best-effort
            continue
    return {"ok": True, "migrated": migrated, "scanned": len(legacy_keys)}

