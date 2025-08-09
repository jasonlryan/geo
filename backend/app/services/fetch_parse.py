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


async def parse_main_text(html: str) -> str:
    # Placeholder: a real impl would use readability + trafilatura
    # For now, return the first N chars as a stub.
    return html[:2000]


async def fetch_and_parse(url: str) -> Optional[dict]:
    html = await fetch_url(url)
    if not html:
        return None
    text = await parse_main_text(html)
    return {"raw_html": html, "text": text}

