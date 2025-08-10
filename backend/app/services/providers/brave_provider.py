from __future__ import annotations

import os
from typing import List, Optional
from urllib.parse import quote

import httpx

from .base import SearchProvider, ProviderResult


class BraveSearchProvider(SearchProvider):
    name = "brave"

    def __init__(self) -> None:
        api_key = os.getenv("BRAVE_API_KEY")
        if not api_key:
            raise RuntimeError("BRAVE_API_KEY not set")
        self.api_key = api_key
        self.base_url = "https://api.search.brave.com/res/v1/web/search"

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        """
        Search using Brave Search API.
        Docs: https://api.search.brave.com/app/documentation/web-search/get-started
        """
        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": self.api_key
        }
        
        params = {
            "q": query,
            "count": min(limit, 20),  # Brave max is 20
            "offset": 0,
            "mkt": "en-US",  # Market for better authority source discovery
            "safesearch": "moderate",
            "textDecorations": False,
            "textFormat": "Raw"
        }
        
        # Add optional geographic/freshness controls
        country = os.getenv("BRAVE_COUNTRY", "us") 
        freshness = os.getenv("BRAVE_FRESHNESS")  # day, week, month, year
        
        if country:
            params["country"] = country
        if freshness:
            params["freshness"] = freshness

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(
                    self.base_url,
                    headers=headers,
                    params=params
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            # Log error but don't fail entire search pipeline
            print(f"Brave Search API error: {e}")
            return []

        results = []
        web_results = data.get("web", {}).get("results", [])
        
        for r in web_results[:limit]:
            title = (r.get("title") or r.get("url") or "").strip()
            url = (r.get("url") or "").strip()
            description = r.get("description", "")
            
            # Brave doesn't provide explicit scores, estimate from position
            position = len(results) + 1
            estimated_score = max(0.1, 1.0 - (position * 0.05))
            
            # Extract published date if available
            published_at = self._extract_published_date(r)
            
            if not url or not title:
                continue
                
            result = ProviderResult(
                title=title,
                url=url,
                snippet=description,
                provider=self.name,
                score=estimated_score,
                published_at=published_at
            )
            
            # Initialize consensus tracking for this provider
            result.add_provider_discovery(self.name, estimated_score)
            
            results.append(result)
            
        return results

    def _extract_published_date(self, result: dict) -> Optional[str]:
        """Extract published date from Brave result metadata."""
        # Brave sometimes includes age/date info in meta or extra fields
        meta = result.get("meta", {})
        age = result.get("age")  # Sometimes available
        
        if age:
            return age
            
        # Look for date patterns in meta or description
        extra = result.get("extra", {})
        if "date" in extra:
            return extra["date"]
            
        return None