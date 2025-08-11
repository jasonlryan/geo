import json
import uuid
from datetime import datetime
import os
import hashlib
from typing import Dict, Any, Optional

from ..core.cache import CACHE
from ..utils.source_categorization import categorize_source


class Store:
    def create_run(self, bundle: Dict[str, Any]) -> str:
        run_data = bundle["run"]
        run_id = run_data.get("run_id") or str(uuid.uuid4())
        run_data["run_id"] = run_id
        
        # Add source categorization and credibility scoring to each source
        sources = bundle.get("sources", [])
        provider_stats = {}
        
        for source in sources:
            domain = source.get("domain", "")
            media_type = source.get("media_type", "")
            category = categorize_source(domain, media_type)
            source["category"] = category
            
            # NO HARDCODED CREDIBILITY - TRUE citation selector handles this
            # credibility scoring REMOVED - was biasing results
            
            # Track provider performance stats
            provider = source.get("search_provider", "unknown")
            if provider not in provider_stats:
                provider_stats[provider] = {
                    "count": 0,
                    # "total_credibility": REMOVED - no hardcoded scores
                    "categories": {},
                    "avg_content_length": 0,
                    "total_content_length": 0
                }
            
            stats = provider_stats[provider]
            stats["count"] += 1
            # stats["total_credibility"] REMOVED - no hardcoded scores
            stats["total_content_length"] += source.get("content_length", 0)
            
            # Track category distribution per provider
            if category not in stats["categories"]:
                stats["categories"][category] = 0
            stats["categories"][category] += 1
        
        # Calculate averages and finalize provider stats
        for provider, stats in provider_stats.items():
            if stats["count"] > 0:
                # stats["avg_credibility"] REMOVED - no hardcoded scores
                stats["avg_content_length"] = round(stats["total_content_length"] / stats["count"], 0)
            # Remove totals (keep only aggregated values)
            # del stats["total_credibility"] REMOVED
            del stats["total_content_length"]
        
        # Add provider performance data to bundle
        bundle["provider_performance"] = provider_stats
        
        # Add computed analysis with funnel metrics
        from ..services.analysis import compute_analysis
        analysis = compute_analysis(bundle)
        bundle["analysis"] = analysis  # Always include analysis metrics

        # ONLY REDIS - Store the complete bundle permanently (no TTL)
        CACHE.set_json(CACHE.ai_key(f"{run_id}"), bundle, ttl=-1)

        # Store query hash for deduplication (30m TTL)
        query = (run_data.get("query") or "").strip().lower()
        if query:
            qhash = hashlib.sha256((query + os.getenv("PIPELINE_VERSION", "1")).encode()).hexdigest()
            CACHE.set(CACHE.ai_key(f"query_hash:{qhash}"), run_id, ttl=30 * 60)
            # Add to query history list (7d TTL)
            CACHE.lpush(CACHE.ai_key(f"q:{qhash}"), run_id)
            CACHE.ltrim(CACHE.ai_key(f"q:{qhash}"), 20)

        # Index this run for recent queries (permanent)
        created_at = run_data.get("created_at")
        ts = None
        if isinstance(created_at, str):
            try:
                iso = created_at[:-1] if created_at.endswith("Z") else created_at
                ts = datetime.fromisoformat(iso).timestamp()
            except Exception:
                ts = None
        if ts is None:
            ts = datetime.now(datetime.UTC).timestamp()
        CACHE.zadd(CACHE.ai_key("recent"), score=ts, member=run_id)
        
        return run_id

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        # ONLY REDIS
        return CACHE.get_json(CACHE.ai_key(f"{run_id}"))

    def list_runs(self) -> Dict[str, Dict[str, Any]]:
        # Get all runs from Redis
        recent_key = CACHE.ai_key("recent")
        items = CACHE.zrevrange_withscores(recent_key, 0, -1)
        
        runs = {}
        for run_id, _ in items:  # Ignore the scores, just get run_ids
            bundle = CACHE.get_json(CACHE.ai_key(f"{run_id}"))
            if bundle:
                runs[run_id] = bundle
        
        return runs


STORE = Store()