from __future__ import annotations

import os
from typing import List, Optional, Dict, Any
import re

import httpx

from .base import SearchProvider, ProviderResult


class PerplexityProvider(SearchProvider):
    name = "perplexity"

    def __init__(self) -> None:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY not set")
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        """
        Search using Perplexity API with Sonar models for web-grounded responses.
        Unlike other providers, this returns LLM-curated results with built-in citations.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("SITE_URL", "https://geo-search.com"),
            "X-Title": os.getenv("SITE_NAME", "Geo Search")
        }
        
        # Use Sonar model via OpenRouter - prefix with perplexity/
        model = "perplexity/sonar"
        
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
            "temperature": 0.1
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
            # Get content from response
            choices = data.get("choices", [])
            if not choices:
                return results
                
            message = choices[0].get("message", {})
            content = message.get("content", "")
            
            # OpenRouter puts citations at root level
            citations = data.get("citations", [])
            
            # Also check for annotations in message
            annotations = message.get("annotations", [])
            annotation_urls = []
            for ann in annotations:
                if ann.get("type") == "url_citation":
                    url_cit = ann.get("url_citation", {})
                    if url_cit.get("url"):
                        annotation_urls.append({
                            "url": url_cit["url"],
                            "title": url_cit.get("title", "")
                        })
            
            # Combine all sources
            all_urls = []
            
            # Add root-level citations
            for url in citations:
                if url and isinstance(url, str):
                    all_urls.append(url)
            
            # Add annotation URLs if no root citations
            if not all_urls and annotation_urls:
                all_urls = [a["url"] for a in annotation_urls]
            
            # Create ProviderResults for each cited source
            for i, url in enumerate(all_urls[:limit]):
                # Check if we have a title from annotations
                title = None
                for ann in annotation_urls:
                    if ann["url"] == url and ann["title"]:
                        title = ann["title"]
                        break
                
                # Otherwise generate from URL/content
                if not title:
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