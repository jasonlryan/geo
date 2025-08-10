"""
Utility for managing and extending source categories.
"""
from typing import Dict, List, Set
from ..core.cache import CACHE

def get_all_domains_from_runs() -> Dict[str, int]:
    """Get all unique domains from stored runs to help identify new categories."""
    all_keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
    run_keys = [k for k in all_keys if not any(skip in k for skip in [":analysis:", ":recent", ":reports", ":q:", ":query_hash:"])]
    
    domains = {}
    for key in run_keys:
        bundle = CACHE.get_json(key)
        if bundle and "sources" in bundle:
            for source in bundle["sources"]:
                domain = source.get("domain", "").lower()
                if domain:
                    domains[domain] = domains.get(domain, 0) + 1
    
    return dict(sorted(domains.items(), key=lambda x: x[1], reverse=True))

def analyze_uncategorized_sources() -> List[Dict]:
    """Find sources that might need new categories (currently categorized as 'web')."""
    all_keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
    run_keys = [k for k in all_keys if not any(skip in k for skip in [":analysis:", ":recent", ":reports", ":q:", ":query_hash:"])]
    
    uncategorized = []
    for key in run_keys:
        bundle = CACHE.get_json(key)
        if bundle and "sources" in bundle:
            for source in bundle["sources"]:
                if source.get("category") == "web":
                    uncategorized.append({
                        "domain": source.get("domain", ""),
                        "media_type": source.get("media_type", ""),
                        "url": source.get("url", ""),
                        "title": source.get("title", "")[:100]
                    })
    
    return uncategorized

def get_category_distribution() -> Dict[str, Dict]:
    """Get detailed category distribution across all runs."""
    all_keys = CACHE.keys(f"{CACHE.ai_prefix()}:*")
    run_keys = [k for k in all_keys if not any(skip in k for skip in [":analysis:", ":recent", ":reports", ":q:", ":query_hash:"])]
    
    categories = {}
    total_sources = 0
    
    for key in run_keys:
        bundle = CACHE.get_json(key)
        if bundle and "sources" in bundle:
            for source in bundle["sources"]:
                category = source.get("category", "unknown")
                domain = source.get("domain", "")
                
                if category not in categories:
                    categories[category] = {"count": 0, "domains": set()}
                
                categories[category]["count"] += 1
                if domain:
                    categories[category]["domains"].add(domain)
                total_sources += 1
    
    # Convert sets to lists and add percentages
    result = {}
    for category, data in categories.items():
        result[category] = {
            "count": data["count"],
            "percentage": round(data["count"] / total_sources * 100, 1) if total_sources > 0 else 0,
            "top_domains": list(data["domains"])[:10]  # Top 10 domains
        }
    
    return dict(sorted(result.items(), key=lambda x: x[1]["count"], reverse=True))

if __name__ == "__main__":
    print("=== Source Category Analysis ===\n")
    
    print("Current category distribution:")
    categories = get_category_distribution()
    for category, data in categories.items():
        print(f"  {category}: {data['count']} ({data['percentage']}%)")
        print(f"    Top domains: {', '.join(data['top_domains'][:5])}")
        print()
    
    print("\nAll domains (top 20):")
    domains = get_all_domains_from_runs()
    for domain, count in list(domains.items())[:20]:
        print(f"  {domain}: {count}")
    
    print(f"\nUncategorized sources (showing first 10):")
    uncategorized = analyze_uncategorized_sources()[:10]
    for i, source in enumerate(uncategorized, 1):
        print(f"  {i}. {source['domain']} - {source['title']}")