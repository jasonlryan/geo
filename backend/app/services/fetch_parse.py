from __future__ import annotations

import asyncio
from typing import Optional

import httpx
import hashlib
from ..core.cache import CACHE


async def fetch_url(url: str, *, timeout: float = 15.0) -> Optional[str]:
    cache_key = f"cache:content:{hashlib.sha256(url.encode()).hexdigest()}"
    cached = CACHE.get(cache_key)
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "demo-bot/0.1"})
            if r.status_code >= 400:
                return None
            text = r.text
            CACHE.set(cache_key, text, ttl=7 * 24 * 3600)
            return text
    except Exception:
        return None


async def parse_main_text(html: str) -> dict:
    """Extract clean article text using trafilatura + readability fallback."""
    try:
        import trafilatura
        from readability import Document
        from datetime import datetime
        
        # Primary: Use trafilatura for clean text extraction
        trafilatura_result = trafilatura.extract(html, include_comments=False, include_tables=False)
        
        # Also get metadata if available
        metadata = trafilatura.extract_metadata(html)
        
        # Fallback: Use readability if trafilatura fails or returns short content
        readability_text = ""
        if not trafilatura_result or len(trafilatura_result) < 200:
            try:
                doc = Document(html)
                readability_text = doc.summary(html_partial=True)
                # Strip HTML tags from readability output
                import re
                readability_text = re.sub(r'<[^>]+>', '', readability_text)
            except Exception:
                readability_text = ""
        
        # Choose the best extraction result
        main_text = trafilatura_result if trafilatura_result and len(trafilatura_result) >= 200 else readability_text
        
        # If both fail, fall back to HTML stub (better than nothing)
        if not main_text or len(main_text) < 100:
            main_text = html[:2000]  # Original fallback
        
        # Extract metadata
        title = metadata.title if metadata else ""
        author = metadata.author if metadata else ""
        published_date = metadata.date if metadata else ""
        
        # Try to parse published date
        published_at = None
        if published_date:
            try:
                # trafilatura returns dates in various formats
                from dateutil import parser
                published_at = parser.parse(published_date).isoformat()
            except Exception:
                published_at = None
        
        return {
            "text": main_text.strip(),
            "title": title,
            "author": author,
            "published_at": published_at,
            "extraction_method": "trafilatura" if trafilatura_result else ("readability" if readability_text else "html_fallback"),
            "content_length": len(main_text.strip())
        }
        
    except ImportError:
        # If dependencies aren't installed, fall back to original method
        return {
            "text": html[:2000],
            "title": "",
            "author": "",
            "published_at": None,
            "extraction_method": "html_fallback",
            "content_length": min(2000, len(html))
        }
    except Exception as e:
        # Any other error, fall back gracefully
        print(f"[PARSE ERROR] {str(e)}")
        return {
            "text": html[:2000] if html else "",
            "title": "",
            "author": "",
            "published_at": None,
            "extraction_method": "error_fallback",
            "content_length": min(2000, len(html)) if html else 0
        }


async def fetch_and_parse(url: str) -> Optional[dict]:
    html = await fetch_url(url)
    if not html:
        return None
    
    # Parse with the new enhanced method
    parsed_result = await parse_main_text(html)
    
    return {
        "raw_html": html,
        "raw_text": parsed_result["text"],  # Clean extracted text
        "title": parsed_result["title"],
        "author": parsed_result["author"], 
        "published_at": parsed_result["published_at"],
        "extraction_method": parsed_result["extraction_method"],
        "content_length": parsed_result["content_length"],
        # Keep the old "text" field for backward compatibility
        "text": parsed_result["text"]
    }

