#!/usr/bin/env python3
"""
Backfill source categories for existing search runs.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env"))

from app.core.cache import CACHE
from app.utils.source_categorization import categorize_source

def main():
    print("=== Backfilling Source Categories ===\n")
    
    # Get all search run keys
    all_keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
    run_keys = []
    
    for key in all_keys:
        # Skip analysis and index keys, only get run data
        if ":analysis:" in key or ":recent" in key or ":reports" in key or ":q:" in key or ":query_hash:" in key:
            continue
        run_keys.append(key)
    
    print(f"Found {len(run_keys)} search runs to backfill")
    
    updated_count = 0
    
    for key in run_keys:
        bundle = CACHE.get_json(key)
        if not bundle or "sources" not in bundle:
            continue
            
        sources = bundle["sources"]
        run_id = bundle.get("run", {}).get("run_id", "unknown")
        
        # Force re-categorization with improved logic (comment out to skip existing)
        # has_categories = any("category" in source for source in sources)
        # if has_categories:
        #     print(f"  {run_id}: Sources already have categories")
        #     continue
        
        # Add categories to sources
        for source in sources:
            domain = source.get("domain", "")
            media_type = source.get("media_type", "")
            category = categorize_source(domain, media_type)
            source["category"] = category
        
        # Save back to Redis
        try:
            CACHE.set_json(key, bundle)
            print(f"  ✅ {run_id}: Added categories to {len(sources)} sources")
            updated_count += 1
        except Exception as e:
            print(f"  ❌ {run_id}: Error updating - {e}")
    
    print(f"\n=== Backfill Complete ===")
    print(f"Updated {updated_count} runs with source categories")
    
    # Show category distribution
    categories = {}
    total_sources = 0
    
    for key in run_keys:
        bundle = CACHE.get_json(key)
        if bundle and "sources" in bundle:
            for source in bundle["sources"]:
                category = source.get("category", "Unknown")
                categories[category] = categories.get(category, 0) + 1
                total_sources += 1
    
    print(f"\nSource category distribution ({total_sources} total sources):")
    for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / total_sources * 100) if total_sources > 0 else 0
        print(f"  {category}: {count} ({percentage:.1f}%)")

if __name__ == "__main__":
    main()