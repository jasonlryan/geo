from __future__ import annotations

import os
from typing import List, Optional
from datetime import datetime, timezone

import httpx

from .base import SearchProvider, ProviderResult


class BingSearchProvider(SearchProvider):
    name = "bing"

    def __init__(self) -> None:
        api_key = os.getenv("BING_SUBSCRIPTION_KEY")
        if not api_key:
            raise RuntimeError("BING_SUBSCRIPTION_KEY not set")
        self.api_key = api_key
        self.base_url = "https://api.bing.microsoft.com/v7.0/search"

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        """
        Search using Bing Web Search API.
        Docs: https://docs.microsoft.com/en-us/bing/search-apis/bing-web-search/
        """
        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,
            "Accept": "application/json",
            "User-Agent": "GeoSearchResearch/1.0"
        }
        
        params = {
            "q": query,
            "count": min(limit, 50),  # Bing max is 50
            "offset": 0,
            "mkt": os.getenv("BING_MARKET", "en-US"),  # Market for localization
            "safeSearch": "Moderate",
            "textDecorations": False,
            "textFormat": "Raw",
            "responseFilter": "Webpages"  # Focus on web results
        }
        
        # Add freshness filter if configured
        freshness = os.getenv("BING_FRESHNESS")  # Day, Week, Month
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
            print(f"Bing Search API error: {e}")
            return []

        results = []
        web_pages = data.get("webPages", {})
        web_results = web_pages.get("value", [])
        
        for i, r in enumerate(web_results[:limit]):
            title = (r.get("name") or r.get("url") or "").strip()
            url = (r.get("url") or "").strip()
            snippet = r.get("snippet", "")
            
            # Bing doesn't provide explicit relevance scores
            # Estimate based on position and any available signals
            position = i + 1
            estimated_score = max(0.1, 1.0 - (position * 0.04))
            
            # Boost score slightly for authority domains
            if self._is_authority_domain(url):
                estimated_score *= 1.1
            
            # Extract published date
            published_at = self._extract_published_date(r)
            
            if not url or not title:
                continue
                
            result = ProviderResult(
                title=title,
                url=url,
                snippet=snippet,
                provider=self.name,
                score=estimated_score,
                published_at=published_at
            )
            
            # Initialize consensus tracking
            result.add_provider_discovery(self.name, estimated_score)
            
            results.append(result)
            
        return results

    def _is_authority_domain(self, url: str) -> bool:
        """Check if URL is from authority domain for score boosting."""
        if not url:
            return False
            
        url_lower = url.lower()
        authority_indicators = [
            ".gov/", ".gov?",
            ".edu/", ".edu?", 
            ".org/", ".org?",
            "who.int", "europa.eu", "un.org",
            "arxiv.org", "pubmed.ncbi"
        ]
        
        return any(indicator in url_lower for indicator in authority_indicators)

    def _extract_published_date(self, result: dict) -> Optional[str]:
        """Extract published date from Bing result metadata."""
        
        # Bing sometimes provides dateLastCrawled or other date fields
        date_crawled = result.get("dateLastCrawled")
        if date_crawled:
            try:
                # Parse and return ISO format
                dt = datetime.fromisoformat(date_crawled.replace("Z", "+00:00"))
                return dt.isoformat()
            except Exception:
                pass
        
        # Look for date in displayUrl or other fields
        display_url = result.get("displayUrl", "")
        if any(date_pattern in display_url.lower() for date_pattern in ["2023", "2024", "2025"]):
            # Could extract year from URL path, but this is heuristic
            pass
            
        return None