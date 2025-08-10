from __future__ import annotations

import asyncio
import os
from typing import List

from .providers.base import ProviderResult
from .fetch_parse import fetch_and_parse
from .providers.tavily_provider import TavilySearchProvider
from .providers.openai_provider import OpenAISearchProvider


async def expand_queries(base_query: str) -> List[str]:
    # TODO: Implement with OpenAI prompt; for now, return base + simple variants
    return [base_query, f"{base_query} 2025", f"latest {base_query}"]


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
    tasks = [fetch_and_parse(r.url) for r in results[:max_docs]]
    parsed = await asyncio.gather(*tasks)
    docs = []
    for r, p in zip(results[:max_docs], parsed):
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

