#!/usr/bin/env python3
"""
Canonical Redis utility for the AI Search Marketing Intelligence platform.
All Redis operations should go through this module to ensure consistency.
"""
import os
import sys
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env"))

from app.core.cache import CACHE

class RedisUtils:
    """Canonical Redis operations for the platform."""
    
    @staticmethod
    def get_cache():
        """Get the canonical cache instance."""
        return CACHE
    
    @staticmethod
    def list_all_keys(pattern: str = "*") -> List[str]:
        """List all keys matching pattern."""
        if pattern == "*":
            pattern = f"{CACHE.ai_prefix()}:*"
        return CACHE.keys(pattern)
    
    @staticmethod
    def get_search_runs() -> List[Dict[str, Any]]:
        """Get all search run data."""
        keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
        runs = []
        
        for key in keys:
            # Skip analysis and index keys, only get run data
            if ":analysis:" in key or ":recent" in key or ":reports" in key or ":q:" in key or ":query_hash:" in key:
                continue
                
            # This should be a run bundle
            bundle = CACHE.get_json(key)
            if bundle and "run" in bundle:
                run_data = bundle["run"]
                runs.append({
                    "run_id": run_data.get("run_id"),
                    "query": run_data.get("query"),
                    "search_model": run_data.get("search_model", "Unknown"),
                    "created_at": run_data.get("created_at"),
                    "sources_count": len(bundle.get("sources", [])),
                    "cited_count": len(bundle.get("evidence", [])),
                    "bundle": bundle
                })
        
        # Sort by created_at
        runs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return runs
    
    @staticmethod
    def get_intelligence_reports() -> List[Dict[str, Any]]:
        """Get all stored intelligence reports."""
        try:
            reports_index = CACHE.zrevrange_withscores(CACHE.ai_key("reports"), 0, -1)
            reports = []
            
            for run_id, timestamp in reports_index:
                analysis = CACHE.get_json(CACHE.ai_key(f"analysis:{run_id}"))
                if analysis and "metadata" in analysis:
                    metadata = analysis["metadata"]
                    reports.append({
                        "run_id": run_id,
                        "query": metadata.get("query", ""),
                        "search_model": metadata.get("search_model", "Unknown"),
                        "created_at": metadata.get("created_at", ""),
                        "generated_at": metadata.get("generated_at", ""),
                        "has_analysis": bool(analysis.get("analysis") or analysis.get("classifications")),
                        "timestamp": timestamp
                    })
            
            return reports
        except Exception as e:
            print(f"Error getting intelligence reports: {e}")
            return []
    
    @staticmethod
    def get_aggregate_stats() -> Dict[str, Any]:
        """Get aggregate statistics across all runs."""
        runs = RedisUtils.get_search_runs()
        
        total_sources = sum(run["sources_count"] for run in runs)
        total_cited = sum(run["cited_count"] for run in runs)
        avg_citation_rate = (total_cited / total_sources) if total_sources > 0 else 0.0
        
        # Get domain distribution
        domain_citations = {}
        for run in runs:
            bundle = run.get("bundle", {})
            sources = bundle.get("sources", [])
            evidence = bundle.get("evidence", [])
            cited_ids = {e.get("source_id") for e in evidence if e.get("source_id")}
            
            src_by_id = {s.get("source_id"): s for s in sources}
            for sid in cited_ids:
                s = src_by_id.get(sid)
                if not s:
                    continue
                domain = (s.get("domain") or "").lower()
                if domain:
                    domain_citations[domain] = domain_citations.get(domain, 0) + 1
        
        domains_top = sorted(domain_citations.items(), key=lambda x: x[1], reverse=True)[:20]
        
        return {
            "runs": len(runs),
            "totals": {
                "total_sources": total_sources,
                "total_cited_sources": total_cited,
                "avg_citation_rate": round(avg_citation_rate, 4),
            },
            "domains_top": domains_top,
        }
    
    @staticmethod
    def cleanup_expired_keys():
        """Clean up any expired or orphaned keys."""
        keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
        cleaned = 0
        
        for key in keys:
            try:
                ttl = CACHE.ttl(key)
                if ttl is not None and ttl == -2:  # Key expired but not cleaned up
                    CACHE.delete(key)
                    cleaned += 1
            except Exception:
                pass
        
        return cleaned
    
    @staticmethod
    def show_status() -> Dict[str, Any]:
        """Show comprehensive Redis status."""
        keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
        
        key_types = {
            "search_bundles": [],
            "intelligence_reports": [],
            "indices": [],
            "other": []
        }
        
        for key in keys:
            if key.endswith(":recent") or key.endswith(":reports"):
                key_types["indices"].append(key)
            elif ":analysis:" in key:
                key_types["intelligence_reports"].append(key)
            elif ":q:" in key or ":query_hash:" in key:
                key_types["other"].append(key)
            else:
                # Should be search bundle
                key_types["search_bundles"].append(key)
        
        return {
            "total_keys": len(keys),
            "key_types": {k: len(v) for k, v in key_types.items()},
            "detailed_keys": key_types,
            "cache_backend": CACHE.backend,
            "redis_configured": CACHE._redis is not None,
            "ai_prefix": CACHE.ai_prefix()
        }

def main():
    """CLI interface for Redis utils."""
    if len(sys.argv) < 2:
        print("Usage: python redis_utils.py <command>")
        print("Commands: status, runs, reports, stats, cleanup")
        return
    
    command = sys.argv[1].lower()
    
    if command == "status":
        status = RedisUtils.show_status()
        print("=== Redis Status ===")
        print(f"Total keys: {status['total_keys']}")
        print(f"Cache backend: {status['cache_backend']}")
        print(f"Redis configured: {status['redis_configured']}")
        print(f"AI prefix: {status['ai_prefix']}")
        print("\nKey distribution:")
        for key_type, count in status['key_types'].items():
            print(f"  {key_type}: {count}")
    
    elif command == "runs":
        runs = RedisUtils.get_search_runs()
        print(f"=== Search Runs ({len(runs)}) ===")
        for run in runs:
            print(f"{run['run_id']}: {run['query'][:50]}... ({run['search_model']}, {run['sources_count']} sources)")
    
    elif command == "reports":
        reports = RedisUtils.get_intelligence_reports()
        print(f"=== Intelligence Reports ({len(reports)}) ===")
        for report in reports:
            print(f"{report['run_id']}: {report['query'][:50]}... (generated: {report.get('generated_at', 'N/A')})")
    
    elif command == "stats":
        stats = RedisUtils.get_aggregate_stats()
        print("=== Aggregate Statistics ===")
        print(f"Runs: {stats['runs']}")
        print(f"Total sources: {stats['totals']['total_sources']}")
        print(f"Cited sources: {stats['totals']['total_cited_sources']}")
        print(f"Citation rate: {stats['totals']['avg_citation_rate']*100:.1f}%")
        print(f"Top domains: {len(stats['domains_top'])}")
    
    elif command == "cleanup":
        cleaned = RedisUtils.cleanup_expired_keys()
        print(f"Cleaned up {cleaned} expired keys")
    
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()