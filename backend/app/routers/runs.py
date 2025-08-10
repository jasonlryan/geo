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
            CACHE.set_json(CACHE.ai_key(f"analysis:{run_id}"), enriched_data, ttl=-1)  # Permanent storage for intelligence reports
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
            CACHE.set_json(CACHE.ai_key(f"analysis:{run_id}"), data, ttl=-1)
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


@router.get("/insights/meta_analysis")
def insights_meta_analysis(subject: str = None):
    """Enhanced meta-intelligence analysis across all runs for a subject.
    
    Returns strategic intelligence aggregated across multiple queries:
    - Cross-query competitive analysis
    - Authority patterns and success factors
    - Content strategy gaps and opportunities
    - Publication strategy recommendations
    - Quarterly action planning data
    """
    recent = CACHE.zrevrange_withscores(CACHE.ai_key("recent"), 0, -1)
    run_ids = [m for m, _ in recent]
    
    # Data structures for meta-analysis
    all_runs = []
    query_patterns = {}
    domain_performance = {}  # domain -> {total_queries: int, cited_in: int, citation_count: int}
    category_performance = {}  # category -> {queries: set, citations: int, sources: int}
    content_gaps = {}  # topic areas with low competition
    success_patterns = []  # characteristics of highly cited sources
    publication_effectiveness = {}  # platform -> citation rates
    
    for run_id in run_ids:
        bundle = CACHE.get_json(CACHE.ai_key(f"{run_id}"))
        if not bundle:
            continue
            
        # Filter by subject
        if subject:
            bundle_subject = bundle.get("run", {}).get("subject")
            if bundle_subject != subject:
                continue
        
        all_runs.append(bundle)
        query = bundle.get("run", {}).get("query", "")
        sources = bundle.get("sources", [])
        evidence = bundle.get("evidence", [])
        
        # Track query patterns
        query_words = set(query.lower().split())
        for word in query_words:
            if len(word) > 3:  # Skip short words
                if word not in query_patterns:
                    query_patterns[word] = {"count": 0, "avg_sources": 0, "avg_citations": 0}
                query_patterns[word]["count"] += 1
                query_patterns[word]["avg_sources"] += len(sources)
                query_patterns[word]["avg_citations"] += len(evidence)
        
        # Analyze domain performance across queries
        cited_ids = {e.get("source_id") for e in evidence if e.get("source_id")}
        src_by_id = {s.get("source_id"): s for s in sources}
        
        # Track all domains that appeared in this query
        domains_in_query = set()
        for source in sources:
            domain = source.get("domain", "").lower()
            if domain:
                domains_in_query.add(domain)
                if domain not in domain_performance:
                    domain_performance[domain] = {
                        "total_queries": 0,
                        "cited_in": 0, 
                        "total_citations": 0,
                        "total_appearances": 0
                    }
                domain_performance[domain]["total_queries"] = len(all_runs)  # Will be updated each iteration
                domain_performance[domain]["total_appearances"] += 1
        
        # Track citations per domain
        for sid in cited_ids:
            source = src_by_id.get(sid)
            if source:
                domain = source.get("domain", "").lower()
                category = source.get("category", "web")
                
                if domain:
                    domain_performance[domain]["total_citations"] += 1
                    if domain in domains_in_query:
                        domain_performance[domain]["cited_in"] += 1
                
                # Category performance
                if category not in category_performance:
                    category_performance[category] = {
                        "queries": set(),
                        "citations": 0,
                        "sources": 0
                    }
                category_performance[category]["queries"].add(run_id)
                category_performance[category]["citations"] += 1
        
        # Track all sources per category
        for source in sources:
            category = source.get("category", "web")
            if category in category_performance:
                category_performance[category]["sources"] += 1
        
        # Identify content gaps (queries with few sources)
        source_count = len(sources)
        if source_count < 5:  # Low competition threshold
            gap_key = f"low_competition_{len(content_gaps)}"
            content_gaps[gap_key] = {
                "query": query,
                "source_count": source_count,
                "citation_rate": len(evidence) / max(source_count, 1),
                "opportunity_score": (5 - source_count) * 20  # Higher score = bigger opportunity
            }
    
    # Calculate final domain performance metrics
    total_queries = len(all_runs)
    domain_insights = []
    for domain, stats in domain_performance.items():
        citation_rate = stats["total_citations"] / max(stats["total_appearances"], 1)
        query_presence = (stats["cited_in"] / max(total_queries, 1)) * 100
        
        domain_insights.append({
            "domain": domain,
            "query_presence_pct": round(query_presence, 1),
            "total_citations": stats["total_citations"],
            "citation_rate": round(citation_rate, 2),
            "dominance_score": round(query_presence * citation_rate, 2)
        })
    
    # Sort by dominance score
    domain_insights.sort(key=lambda x: x["dominance_score"], reverse=True)
    
    # Category insights
    category_insights = []
    for category, stats in category_performance.items():
        query_presence = len(stats["queries"])
        citation_rate = stats["citations"] / max(stats["sources"], 1)
        
        category_insights.append({
            "category": category,
            "queries_present": query_presence,
            "total_citations": stats["citations"], 
            "total_sources": stats["sources"],
            "citation_rate": round(citation_rate, 3),
            "effectiveness_score": round(query_presence * citation_rate, 2)
        })
    
    category_insights.sort(key=lambda x: x["effectiveness_score"], reverse=True)
    
    # Generate strategic recommendations
    recommendations = generate_strategic_recommendations(
        all_runs, domain_insights, category_insights, content_gaps, total_queries
    )
    
    return {
        "subject": subject,
        "total_queries_analyzed": total_queries,
        "competitive_landscape": {
            "dominant_players": domain_insights[:10],
            "category_performance": category_insights,
            "market_concentration": calculate_market_concentration(domain_insights)
        },
        "content_opportunities": {
            "gaps": list(content_gaps.values())[:10],
            "low_competition_topics": [g for g in content_gaps.values() if g["source_count"] <= 3]
        },
        "strategic_recommendations": recommendations,
        "meta_patterns": {
            "most_competitive_query_terms": sorted(
                [(k, v["avg_sources"]/v["count"]) for k, v in query_patterns.items() if v["count"] > 1],
                key=lambda x: x[1], reverse=True
            )[:10]
        }
    }


def generate_strategic_recommendations(runs, domain_insights, category_insights, gaps, total_queries):
    """Generate strategic recommendations based on meta-analysis"""
    recommendations = {
        "content_strategy": [],
        "competitive_positioning": [],
        "publication_strategy": [],
        "quarterly_priorities": []
    }
    
    # Content strategy recommendations
    if len(gaps) > 0:
        high_opportunity_gaps = [g for g in gaps.values() if g["opportunity_score"] >= 60]
        if high_opportunity_gaps:
            recommendations["content_strategy"].append({
                "priority": "HIGH",
                "action": "Target Low-Competition Topics",
                "detail": f"Found {len(high_opportunity_gaps)} topics with <3 competing sources",
                "impact": "First-mover advantage opportunities"
            })
    
    # Competitive positioning
    if domain_insights:
        top_competitor = domain_insights[0]
        if top_competitor["query_presence_pct"] > 50:
            recommendations["competitive_positioning"].append({
                "priority": "HIGH", 
                "action": f"Challenge {top_competitor['domain']} dominance",
                "detail": f"They appear in {top_competitor['query_presence_pct']}% of queries",
                "impact": "Break competitor monopoly in key areas"
            })
    
    # Publication strategy  
    if category_insights:
        top_category = category_insights[0]
        recommendations["publication_strategy"].append({
            "priority": "MEDIUM",
            "action": f"Focus on {top_category['category']} content",
            "detail": f"Highest citation rate ({top_category['citation_rate']}) in this category",
            "impact": "Maximize publication ROI"
        })
    
    # Quarterly priorities based on analysis
    q1_priority = "Content gap targeting" if gaps else "Competitive differentiation"
    recommendations["quarterly_priorities"] = [
        {"quarter": "Q1", "focus": q1_priority, "rationale": "Address immediate opportunities"},
        {"quarter": "Q2", "focus": "Authority building", "rationale": "Establish thought leadership"},
        {"quarter": "Q3", "focus": "Scale successful formats", "rationale": "Double down on what works"},
        {"quarter": "Q4", "focus": "Market expansion", "rationale": "Enter adjacent topic areas"}
    ]
    
    return recommendations


def calculate_market_concentration(domain_insights):
    """Calculate market concentration metrics"""
    if not domain_insights:
        return {"herfindahl_index": 0, "top_3_share": 0, "market_leader_share": 0}
    
    total_citations = sum(d["total_citations"] for d in domain_insights)
    if total_citations == 0:
        return {"herfindahl_index": 0, "top_3_share": 0, "market_leader_share": 0}
    
    # Market shares
    shares = [d["total_citations"] / total_citations for d in domain_insights]
    
    # Herfindahl Index (measure of market concentration)
    hhi = sum(share ** 2 for share in shares) * 10000
    
    # Top 3 market share
    top_3_share = sum(shares[:3]) * 100
    
    # Market leader share
    market_leader_share = shares[0] * 100 if shares else 0
    
    return {
        "herfindahl_index": round(hhi, 0),
        "top_3_share": round(top_3_share, 1),
        "market_leader_share": round(market_leader_share, 1),
        "market_structure": "Highly Concentrated" if hhi > 2500 else "Moderately Concentrated" if hhi > 1500 else "Competitive"
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

