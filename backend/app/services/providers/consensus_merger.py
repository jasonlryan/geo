from __future__ import annotations

from typing import Dict, List
from urllib.parse import urlparse
from collections import defaultdict

from .base import ProviderResult, ConsensusMergedResult


class ConsensusResultMerger:
    """
    Merge results from multiple providers while preserving consensus signals.
    Instead of losing cross-provider selection data, track it as authority signals.
    """
    
    def __init__(self):
        self.url_canonical_map: Dict[str, str] = {}  # Track URL variations
    
    def merge_provider_results(self, all_results: List[ProviderResult]) -> List[ConsensusMergedResult]:
        """
        Merge results from multiple providers, preserving consensus metadata.
        
        Args:
            all_results: All results from all providers
            
        Returns:
            Deduplicated results with consensus tracking
        """
        # Group by canonical URL
        url_groups = self._group_by_canonical_url(all_results)
        
        merged_results = []
        for canonical_url, results in url_groups.items():
            merged_result = self._merge_url_group(canonical_url, results)
            merged_results.append(merged_result)
        
        # Sort by consensus strength + primary score
        return sorted(
            merged_results, 
            key=lambda r: (r.consensus_boost, max(r.provider_scores.values(), default=0)), 
            reverse=True
        )
    
    def _group_by_canonical_url(self, results: List[ProviderResult]) -> Dict[str, List[ProviderResult]]:
        """Group results by canonical URL, handling URL variations."""
        groups = defaultdict(list)
        
        for result in results:
            canonical_url = self._canonicalize_url(result.url)
            groups[canonical_url].append(result)
            
        return groups
    
    def _canonicalize_url(self, url: str) -> str:
        """
        Canonicalize URL to handle common variations:
        - http vs https
        - trailing slashes
        - www vs non-www
        - query parameters (sometimes)
        """
        try:
            parsed = urlparse(url.lower().strip())
            
            # Normalize scheme to https
            scheme = "https"
            
            # Remove www prefix for comparison
            hostname = parsed.hostname or ""
            if hostname.startswith("www."):
                hostname = hostname[4:]
            
            # Remove trailing slash from path
            path = parsed.path.rstrip("/") or "/"
            
            # Keep query params for now (may contain important context)
            query = parsed.query
            
            canonical = f"{scheme}://{hostname}{path}"
            if query:
                canonical += f"?{query}"
                
            return canonical
            
        except Exception:
            # If URL parsing fails, return original
            return url.lower().strip()
    
    def _merge_url_group(self, canonical_url: str, results: List[ProviderResult]) -> ConsensusMergedResult:
        """Merge a group of results for the same URL from different providers."""
        
        # Use the result with the longest/best title and snippet
        primary_result = max(results, key=lambda r: (len(r.title or ""), r.score))
        
        # Collect all provider discoveries
        discovered_by = []
        provider_scores = {}
        
        for result in results:
            if result.provider not in discovered_by:
                discovered_by.append(result.provider)
                provider_scores[result.provider] = result.score
        
        # Calculate consensus boost
        consensus_boost = self._calculate_consensus_boost(len(discovered_by))
        
        # Determine primary provider (highest scoring)
        primary_provider = max(provider_scores.keys(), key=lambda p: provider_scores[p])
        
        # Merge titles and snippets intelligently
        merged_title = self._merge_titles(results)
        merged_snippet = self._merge_snippets(results)
        
        # Extract authority signals
        authority_signals = self._extract_authority_signals(results, canonical_url)
        
        return ConsensusMergedResult(
            title=merged_title,
            url=primary_result.url,  # Use original URL from primary result
            snippet=merged_snippet,
            published_at=primary_result.published_at,
            discovered_by=discovered_by,
            provider_scores=provider_scores,
            consensus_boost=consensus_boost,
            primary_provider=primary_provider,
            authority_signals=authority_signals
        )
    
    def _calculate_consensus_boost(self, provider_count: int) -> float:
        """Calculate consensus boost based on number of providers."""
        if provider_count <= 1:
            return 0.0
        elif provider_count == 2:
            return 0.15  # 15% boost for dual-provider consensus  
        elif provider_count >= 3:
            return 0.25  # 25% boost for strong consensus (3+ providers)
        return 0.0
    
    def _merge_titles(self, results: List[ProviderResult]) -> str:
        """Choose the best title from multiple provider results."""
        titles = [r.title for r in results if r.title and r.title.strip()]
        if not titles:
            return "Untitled"
        
        # Prefer longer, more descriptive titles
        return max(titles, key=len)
    
    def _merge_snippets(self, results: List[ProviderResult]) -> str:
        """Merge snippets, preferring longer/richer content."""
        snippets = [r.snippet for r in results if r.snippet and r.snippet.strip()]
        if not snippets:
            return ""
        
        # Prefer the longest snippet with most information
        return max(snippets, key=len)
    
    def _extract_authority_signals(self, results: List[ProviderResult], canonical_url: str) -> Dict[str, any]:
        """Extract authority signals for research analysis."""
        parsed = urlparse(canonical_url)
        domain = parsed.hostname or ""
        
        signals = {
            "domain": domain,
            "tld": domain.split(".")[-1] if "." in domain else "",
            "is_gov": domain.endswith(".gov"),
            "is_edu": domain.endswith(".edu") or ".edu." in domain,
            "is_org": domain.endswith(".org"),
            "provider_count": len(results),
            "max_score": max(r.score for r in results),
            "avg_score": sum(r.score for r in results) / len(results),
            "score_variance": self._calculate_score_variance(results)
        }
        
        return signals
    
    def _calculate_score_variance(self, results: List[ProviderResult]) -> float:
        """Calculate score variance across providers for analysis."""
        scores = [r.score for r in results]
        if len(scores) <= 1:
            return 0.0
        
        mean_score = sum(scores) / len(scores)
        variance = sum((score - mean_score) ** 2 for score in scores) / len(scores)
        return variance