from __future__ import annotations

import os
from typing import List, Optional, Dict, Any
import re

import httpx

from .base import SearchProvider, ProviderResult


class GeminiProvider(SearchProvider):
    name = "gemini"

    def __init__(self) -> None:
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_GEMINI_API_KEY not set")
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        """
        Search using Google Gemini API for web-grounded responses.
        Similar to Perplexity, returns AI-curated results with citations.
        """
        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"""You are a research assistant. Search for and provide comprehensive information 
about: {query}

Focus on authoritative sources like government sites, educational institutions, and research papers.
Include the source URL after each major claim in this format: [Source: URL]
Provide at least {limit} different sources with URLs.
Format your response with clear citations that can be extracted."""
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 2048,
                "topP": 0.8,
                "topK": 10
            }
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
            print(f"Gemini API error: {e}")
            return []

        # Extract citations from Gemini response
        results = self._extract_citations_from_response(data, query, limit)
        
        # Initialize consensus tracking for each result
        for result in results:
            result.add_provider_discovery(self.name, result.score)
            
        return results

    def _extract_citations_from_response(self, data: Dict[str, Any], query: str, limit: int) -> List[ProviderResult]:
        """Extract citation URLs and create ProviderResults from Gemini response."""
        results = []
        
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                return results
                
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            
            if not parts:
                return results
                
            text = parts[0].get("text", "")
            
            # Extract URLs with [Source: URL] pattern
            source_pattern = r'\[Source:\s*(https?://[^\]]+)\]'
            source_urls = re.findall(source_pattern, text)
            
            # Also extract any other URLs mentioned
            url_pattern = r'https?://[^\s\[\]()"]+'
            all_urls = re.findall(url_pattern, text)
            
            # Combine and deduplicate, preferring explicitly cited sources
            cited_urls = list(dict.fromkeys(source_urls + all_urls))
            
            # Create ProviderResults for each cited source
            for i, url in enumerate(cited_urls[:limit]):
                # Extract context around this URL
                title = self._generate_title_from_url(url, text)
                snippet = self._extract_snippet_for_url(url, text)
                
                # Score based on citation position and explicit citation
                is_explicit = url in source_urls
                base_score = max(0.3, 1.0 - (i * 0.05))
                explicit_boost = 1.2 if is_explicit else 1.0
                authority_boost = self._get_authority_boost(url)
                final_score = min(1.0, base_score * explicit_boost * authority_boost)
                
                result = ProviderResult(
                    title=title,
                    url=url,
                    snippet=snippet,
                    provider=self.name,
                    score=final_score,
                    published_at=None  # Gemini doesn't provide publish dates
                )
                
                results.append(result)
                
        except Exception as e:
            print(f"Error extracting citations from Gemini response: {e}")
            
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
        # Look for sentences containing the URL
        sentences = content.split(".")
        for sentence in sentences:
            if url in sentence:
                # Clean up the sentence
                sentence = sentence.strip()
                sentence = re.sub(r'\[Source:.*?\]', '', sentence).strip()
                if len(sentence) > 20:
                    return sentence
                    
        # Fallback: get text before URL mention
        url_index = content.find(url)
        if url_index > 0:
            start = max(0, url_index - 100)
            context = content[start:url_index].strip()
            # Get last sentence before URL
            sentences = context.split(".")
            if sentences:
                return sentences[-1].strip()
                
        return ""

    def _extract_snippet_for_url(self, url: str, content: str) -> str:
        """Extract relevant snippet from content that relates to this URL."""
        # Find sentences that mention this URL or appear near it
        sentences = content.split(".")
        relevant_sentences = []
        
        for i, sentence in enumerate(sentences):
            if url in sentence:
                # Include previous sentence for context if available
                if i > 0 and len(sentences[i-1].strip()) > 20:
                    relevant_sentences.append(sentences[i-1].strip())
                # Include current sentence (without the URL)
                clean_sentence = re.sub(r'\[Source:.*?\]', '', sentence).strip()
                if len(clean_sentence) > 20:
                    relevant_sentences.append(clean_sentence)
                # Include next sentence if available
                if i < len(sentences) - 1 and len(sentences[i+1].strip()) > 20:
                    relevant_sentences.append(sentences[i+1].strip())
                break
                
        if relevant_sentences:
            return ". ".join(relevant_sentences[:2]) + "."
        
        # Fallback: return first substantial sentence
        for sentence in sentences:
            clean = sentence.strip()
            if len(clean) > 50:
                return clean + "."
                
        return content[:200] + "..." if len(content) > 200 else content

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