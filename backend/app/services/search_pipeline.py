from __future__ import annotations

import asyncio
import os
from typing import List

from .providers.base import ProviderResult
from .fetch_parse import fetch_and_parse
from .providers.tavily_provider import TavilySearchProvider
from .providers.openai_provider import OpenAISearchProvider


async def expand_queries(base_query: str) -> List[str]:
    """
    Generate query variants that favor authoritative sources over corporate blogs.
    Based on review2 feedback: avoid corporate "trends 2025" bias.
    """
    variants = [base_query]  # Always include the original query
    
    # Authority-favoring variants (instead of just adding "2025" and "latest")
    authority_variants = [
        f'"{base_query}" (site:.gov OR site:.edu OR site:.org)',  # Favor authority domains
        f'{base_query} research paper OR policy OR white paper',   # Favor research content
        f'{base_query} study OR findings OR analysis',             # Academic language
        f'{base_query} report -blog -"best practices" -trends',    # Exclude blog patterns
    ]
    
    # Add selected authority variants (limit to avoid too many API calls)
    variants.extend(authority_variants[:2])  # Use first 2 authority variants
    
    return variants


async def run_search(query: str, limit_per_query: int | None = None) -> List[ProviderResult]:
    if limit_per_query is None:
        limit_per_query = int(os.getenv("SEARCH_LIMIT_PER_QUERY", "20"))
    providers = []
    
    # Multi-provider search: Tavily + OpenAI for diversified recall
    try:
        providers.append(TavilySearchProvider())
    except Exception as e:
        print(f"[ERROR] Failed to initialize Tavily provider: {e}")
    
    try:
        providers.append(OpenAISearchProvider())
    except Exception as e:
        print(f"[ERROR] Failed to initialize OpenAI provider: {e}")
    
    # Return empty if no providers available
    if not providers:
        print("[ERROR] No search providers available")
        return []
    variants = await expand_queries(query)

    async def search_one(p, q: str) -> List[ProviderResult]:
        try:
            return await p.search(q, limit=limit_per_query)
        except Exception:
            return []

    tasks = []
    for p in providers:
        for q in variants:
            tasks.append(search_one(p, q))
    results_lists = await asyncio.gather(*tasks)
    results: List[ProviderResult] = [r for lst in results_lists for r in lst]
    # Simple URL dedupe
    seen = set()
    deduped = []
    for r in results:
        if r.url in seen:
            continue
        seen.add(r.url)
        deduped.append(r)
    return deduped


async def fetch_top(results: List[ProviderResult], *, max_docs: int | None = None) -> List[dict]:
    if max_docs is None:
        max_docs = int(os.getenv("FETCH_MAX_DOCS", "20"))
    
    # Apply authority-based pre-filtering and re-ranking before fetch
    reranked_results = await rerank_by_authority(results)
    
    tasks = [fetch_and_parse(r.url) for r in reranked_results[:max_docs]]
    parsed = await asyncio.gather(*tasks)
    docs = []
    for r, p in zip(reranked_results[:max_docs], parsed):
        if not p:
            continue
        docs.append({
            "title": p.get("title") or r.title,  # Prefer extracted title over provider title
            "url": r.url,
            "snippet": r.snippet,
            "published_at": p.get("published_at") or r.published_at,  # Prefer extracted date
            "provider": r.provider,  # Track which search provider found this source
            "raw_text": p["text"],
            "author": p.get("author", ""),
            "extraction_method": p.get("extraction_method", "unknown"),
            "content_length": p.get("content_length", 0),
            "search_provider": r.provider,  # Explicit field for provider attribution analysis
        })
    return docs


async def rerank_by_authority(results: List[ProviderResult]) -> List[ProviderResult]:
    """
    Re-rank search results to prioritize authoritative sources over corporate blogs.
    Based on review2 feedback: ensure gov/edu/research sources come first.
    """
    from ..utils.source_categorization import categorize_source, calculate_credibility_score
    from urllib.parse import urlparse
    
    scored_results = []
    
    for result in results:
        # Extract domain for categorization
        try:
            domain = urlparse(result.url).netloc.lower()
            domain = domain.replace("www.", "")
        except:
            domain = ""
        
        # Categorize the source
        category = categorize_source(domain, "")
        
        # Calculate credibility score (using stub data since we haven't fetched yet)
        credibility_data = calculate_credibility_score(
            domain=domain,
            category=category,
            published_at=result.published_at,
            content_length=1000,  # Estimate for ranking purposes
            author="",  # Not available at this stage
            title=result.title
        )
        
        authority_score = credibility_data["score"]
        
        # Boost score based on category priority
        category_boosts = {
            "gov": 1.0,       # Highest priority
            "edu": 0.95,      # Very high
            "research": 0.90, # High priority  
            "news": 0.75,     # Medium-high
            "nonprofit": 0.70, # Medium
            "consultancy": 0.60, # Medium-low
            "financial": 0.55, # Lower
            "legal": 0.75,    # Medium-high for legal topics
            "corporate": 0.30, # Low priority
            "blog": 0.20,     # Very low
            "social": 0.10,   # Lowest
        }
        
        category_boost = category_boosts.get(category, 0.40)
        final_score = authority_score * category_boost
        
        scored_results.append((final_score, result))
    
    # Sort by score descending (highest authority first)
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    return [result for score, result in scored_results]

