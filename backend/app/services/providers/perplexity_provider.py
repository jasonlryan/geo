from __future__ import annotations

import os
from typing import List, Optional, Dict, Any
import re

import httpx

from .base import SearchProvider, ProviderResult


class PerplexityProvider(SearchProvider):
    name = "perplexity"

    def __init__(self) -> None:
        api_key = os.getenv("PERPLEXITY_API_KEY")
        if not api_key:
            raise RuntimeError("PERPLEXITY_API_KEY not set")
        self.api_key = api_key
        self.base_url = "https://api.perplexity.ai/chat/completions"

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        """
        Search using Perplexity API with Sonar models for web-grounded responses.
        Unlike other providers, this returns LLM-curated results with built-in citations.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Use Sonar model for web search capabilities
        model = os.getenv("PERPLEXITY_MODEL", "llama-3.1-sonar-small-128k-online")
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a research assistant. Provide comprehensive information "
                        "about the query with proper citations. Focus on authoritative sources "
                        "like government sites, educational institutions, and research papers. "
                        "Include the source URL after each major claim."
                    )
                },
                {
                    "role": "user", 
                    "content": f"Research and provide detailed information about: {query}"
                }
            ],
            "max_tokens": 1500,
            "temperature": 0.1,
            "search_domain_filter": ["arxiv.org", "gov", "edu"],  # Bias toward authority
            "search_recency_filter": "month",
            "return_related_questions": False,
            "return_images": False,
            "return_citations": True
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    self.base_url,
                    headers=headers,
                    json=payload
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            print(f"Perplexity API error: {e}")
            return []

        # Extract citations from Perplexity response
        results = self._extract_citations_from_response(data, query, limit)
        
        # Initialize consensus tracking for each result
        for result in results:
            result.add_provider_discovery(self.name, result.score)
            
        return results

    def _extract_citations_from_response(self, data: Dict[str, Any], query: str, limit: int) -> List[ProviderResult]:
        """Extract citation URLs and create ProviderResults from Perplexity response."""
        results = []
        
        try:
            choices = data.get("choices", [])
            if not choices:
                return results
                
            message = choices[0].get("message", {})
            content = message.get("content", "")
            citations = message.get("citations", [])
            
            # Extract URLs from citations array (Perplexity's structured citations)
            cited_urls = []
            for citation in citations:
                if isinstance(citation, str):
                    cited_urls.append(citation)
                elif isinstance(citation, dict):
                    url = citation.get("url") or citation.get("link")
                    if url:
                        cited_urls.append(url)
            
            # Also extract URLs mentioned in content using regex
            url_pattern = r'https?://[^\s\[\]()"]+'
            content_urls = re.findall(url_pattern, content)
            
            # Combine and deduplicate URLs
            all_urls = list(set(cited_urls + content_urls))
            
            # Create ProviderResults for each cited source
            for i, url in enumerate(all_urls[:limit]):
                # Extract domain-based title hint
                title = self._generate_title_from_url(url, content)
                
                # Extract relevant snippet from content for this URL
                snippet = self._extract_snippet_for_url(url, content)
                
                # Score based on citation position and domain authority
                base_score = max(0.3, 1.0 - (i * 0.05))
                authority_boost = self._get_authority_boost(url)
                final_score = min(1.0, base_score * authority_boost)
                
                result = ProviderResult(
                    title=title,
                    url=url,
                    snippet=snippet,
                    provider=self.name,
                    score=final_score,
                    published_at=None  # Perplexity doesn't provide publish dates
                )
                
                results.append(result)
                
        except Exception as e:
            print(f"Error extracting citations from Perplexity response: {e}")
            
        return results

    def _generate_title_from_url(self, url: str, content: str) -> str:
        """Generate a meaningful title from URL and context."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc or "Unknown Source"
            
            # Look for context around this URL in the content
            url_context = self._find_url_context(url, content)
            if url_context and len(url_context) > 10:
                return url_context[:100] + ("..." if len(url_context) > 100 else "")
            
            # Fallback to domain-based title
            if "arxiv" in domain:
                return f"Research Paper - {domain}"
            elif ".gov" in domain:
                return f"Government Source - {domain}" 
            elif ".edu" in domain:
                return f"Academic Source - {domain}"
            else:
                return f"Source - {domain}"
                
        except Exception:
            return "Referenced Source"

    def _find_url_context(self, url: str, content: str) -> str:
        """Find text context around a URL mention."""
        # Look for text near URL mentions
        url_index = content.find(url)
        if url_index == -1:
            return ""
            
        # Get surrounding context (50 chars before, 100 after)
        start = max(0, url_index - 50)
        end = min(len(content), url_index + len(url) + 100)
        context = content[start:end].strip()
        
        # Clean up and extract meaningful phrase
        sentences = context.split(".")
        for sentence in sentences:
            if len(sentence.strip()) > 20:
                return sentence.strip()
                
        return context

    def _extract_snippet_for_url(self, url: str, content: str) -> str:
        """Extract relevant snippet from content that relates to this URL."""
        # Simple heuristic: find sentences that mention concepts related to the URL
        sentences = content.split(".")
        relevant_sentences = []
        
        domain_keywords = self._extract_domain_keywords(url)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20:
                # Check if sentence contains domain-related keywords
                if any(keyword.lower() in sentence.lower() for keyword in domain_keywords):
                    relevant_sentences.append(sentence)
                    
        if relevant_sentences:
            return ". ".join(relevant_sentences[:2]) + "."
        
        # Fallback: return first substantial sentence
        for sentence in sentences:
            if len(sentence.strip()) > 50:
                return sentence.strip() + "."
                
        return content[:200] + "..." if len(content) > 200 else content

    def _extract_domain_keywords(self, url: str) -> List[str]:
        """Extract keywords from domain for content matching."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc or ""
            path = parsed.path or ""
            
            keywords = []
            
            # Domain-based keywords
            if "arxiv" in domain:
                keywords.extend(["research", "paper", "study"])
            elif ".gov" in domain:
                keywords.extend(["government", "official", "agency"])
            elif ".edu" in domain:
                keywords.extend(["university", "academic", "education"])
            elif "who.int" in domain:
                keywords.extend(["health", "WHO", "medical"])
                
            # Path-based keywords (basic extraction)
            path_parts = [part for part in path.split("/") if len(part) > 3]
            keywords.extend(path_parts[:3])
            
            return keywords
            
        except Exception:
            return ["research"]

    def _get_authority_boost(self, url: str) -> float:
        """Calculate authority boost multiplier for scoring."""
        if not url:
            return 1.0
            
        url_lower = url.lower()
        
        # High authority sources
        if any(domain in url_lower for domain in [".gov/", "arxiv.org", "pubmed.ncbi"]):
            return 1.3
        elif any(domain in url_lower for domain in [".edu/", ".org/", "who.int"]):
            return 1.2
        elif any(domain in url_lower for domain in ["nature.com", "science.org", "ieee.org"]):
            return 1.25
        else:
            return 1.0