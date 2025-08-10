from __future__ import annotations

import os
from typing import List

import httpx

from .base import SearchProvider, ProviderResult


class TavilySearchProvider(SearchProvider):
    name = "tavily"

    def __init__(self) -> None:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise RuntimeError("TAVILY_API_KEY not set")
        self.api_key = api_key

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": os.getenv("TAVILY_SEARCH_DEPTH", "advanced"),  # Use advanced for better quality
            "max_results": min(limit, int(os.getenv("TAVILY_MAX_RESULTS", "10"))),
            "include_answer": False,
            "include_raw_content": True,  # Get better content extraction from Tavily
        }
        
        # Add domain filtering for authority sources if configured
        include_domains = os.getenv("TAVILY_INCLUDE_DOMAINS")
        exclude_domains = os.getenv("TAVILY_EXCLUDE_DOMAINS") 
        
        if include_domains:
            # Parse comma-separated list of domains to include
            payload["include_domains"] = [d.strip() for d in include_domains.split(",") if d.strip()]
            
        if exclude_domains:
            # Parse comma-separated list of domains to exclude
            payload["exclude_domains"] = [d.strip() for d in exclude_domains.split(",") if d.strip()]
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
        except Exception:
            return []

        results = []
        for r in (data.get("results") or [])[:limit]:
            title = (r.get("title") or r.get("url") or "").strip()
            u = (r.get("url") or "").strip()
            snippet = r.get("content") or r.get("snippet")
            score = float(r.get("score") or 0)
            
            # Use Tavily's raw_content if available for better text quality
            raw_content = r.get("raw_content", "")
            if raw_content and len(raw_content) > len(snippet or ""):
                snippet = raw_content[:1500]  # Use cleaner extracted content
                
            if not u:
                continue
            results.append(ProviderResult(
                title=title, 
                url=u, 
                snippet=snippet, 
                provider=self.name, 
                score=score,
                published_at=r.get("published_date")  # Include published date if available
            ))
        return results


