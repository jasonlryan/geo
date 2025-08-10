"""
Content canonicalization and deduplication service.
Prevents duplicate content across search providers and normalizes similar content.
"""

import hashlib
import re
from typing import Dict, List, Set, Tuple
from urllib.parse import urlparse, parse_qs, urlunparse
from difflib import SequenceMatcher


def deduplicate_sources(sources: List[Dict]) -> List[Dict]:
    """
    Remove duplicate sources based on URL canonicalization and content similarity.
    
    Args:
        sources: List of source objects with url, raw_text, title, etc.
        
    Returns:
        Deduplicated list of sources with duplicate info tracked
    """
    if not sources:
        return sources
    
    # Step 1: URL-based deduplication
    url_deduplicated = _deduplicate_by_url(sources)
    
    # Step 2: Content-based deduplication
    content_deduplicated = _deduplicate_by_content(url_deduplicated)
    
    return content_deduplicated


def _deduplicate_by_url(sources: List[Dict]) -> List[Dict]:
    """Remove duplicates based on canonical URL comparison."""
    seen_urls = set()
    deduplicated = []
    
    for source in sources:
        url = source.get("url", "")
        if not url:
            deduplicated.append(source)
            continue
        
        # Canonicalize the URL
        canonical_url = canonicalize_url(url)
        
        if canonical_url not in seen_urls:
            seen_urls.add(canonical_url)
            # Add canonical URL to source metadata
            source_copy = source.copy()
            source_copy["canonical_url"] = canonical_url
            source_copy["dedup_method"] = "url"
            deduplicated.append(source_copy)
        else:
            # Track that this was a URL duplicate
            print(f"[DEDUP] URL duplicate filtered: {url}")
    
    return deduplicated


def _deduplicate_by_content(sources: List[Dict]) -> List[Dict]:
    """Remove duplicates based on content similarity."""
    if len(sources) <= 1:
        return sources
    
    deduplicated = []
    content_hashes = set()
    
    for i, source in enumerate(sources):
        raw_text = source.get("raw_text", "")
        title = source.get("title", "")
        
        # Create content signature
        content_signature = _create_content_signature(raw_text, title)
        
        # Check for exact content matches first
        if content_signature in content_hashes:
            print(f"[DEDUP] Exact content duplicate filtered: {source.get('url', 'unknown')}")
            continue
        
        # Check for similar content
        is_similar = False
        for existing_source in deduplicated:
            if _is_content_similar(source, existing_source, threshold=0.85):
                # Mark as similar content duplicate
                existing_source.setdefault("similar_urls", []).append(source.get("url", ""))
                is_similar = True
                print(f"[DEDUP] Similar content filtered: {source.get('url', 'unknown')} (similar to {existing_source.get('url', 'unknown')})")
                break
        
        if not is_similar:
            content_hashes.add(content_signature)
            source_copy = source.copy()
            source_copy["dedup_method"] = source_copy.get("dedup_method", "content")
            deduplicated.append(source_copy)
    
    return deduplicated


def canonicalize_url(url: str) -> str:
    """
    Canonicalize URL by removing tracking parameters and normalizing format.
    """
    if not url:
        return url
    
    try:
        parsed = urlparse(url.lower())
        
        # Remove common tracking parameters
        tracking_params = {
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
            'fbclid', 'gclid', 'msclkid', 'dclid', 
            'ref', 'source', 'campaign_id', 'ad_id',
            '_ga', '_gac', '_gl', 'mc_cid', 'mc_eid'
        }
        
        # Parse and filter query parameters
        query_params = parse_qs(parsed.query)
        filtered_params = {
            k: v for k, v in query_params.items() 
            if k.lower() not in tracking_params
        }
        
        # Sort parameters for consistent canonicalization
        sorted_params = sorted(filtered_params.items())
        canonical_query = '&'.join(f"{k}={v[0]}" for k, v in sorted_params if v)
        
        # Rebuild canonical URL
        canonical = urlunparse((
            parsed.scheme or 'https',
            parsed.netloc,
            parsed.path.rstrip('/') or '/',
            parsed.params,
            canonical_query,
            ''  # Remove fragment
        ))
        
        return canonical
        
    except Exception:
        # If URL parsing fails, return original
        return url


def _create_content_signature(raw_text: str, title: str) -> str:
    """Create a hash signature for content deduplication."""
    # Normalize content for hashing
    normalized_text = _normalize_content_for_hashing(raw_text)
    normalized_title = _normalize_content_for_hashing(title)
    
    # Combine title and text (title gets more weight)
    combined = f"{normalized_title}|||{normalized_text[:1000]}"  # First 1000 chars for performance
    
    return hashlib.md5(combined.encode('utf-8')).hexdigest()


def _normalize_content_for_hashing(text: str) -> str:
    """Normalize content for consistent hashing."""
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove common boilerplate patterns
    text = re.sub(r'\bcookie\s+policy\b.*?\n', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\bprivacy\s+policy\b.*?\n', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\bterms\s+of\s+(use|service)\b.*?\n', '', text, flags=re.IGNORECASE)
    
    # Remove dates and timestamps (to avoid version differences)
    text = re.sub(r'\b\d{1,2}/\d{1,2}/\d{4}\b', '', text)
    text = re.sub(r'\b\d{4}-\d{2}-\d{2}\b', '', text)
    
    # Remove social media share counts and similar dynamic content
    text = re.sub(r'\b\d+\s+(shares?|likes?|views?|comments?)\b', '', text, flags=re.IGNORECASE)
    
    return text.strip()


def _is_content_similar(source1: Dict, source2: Dict, threshold: float = 0.85) -> bool:
    """Check if two sources have similar content."""
    text1 = source1.get("raw_text", "")
    text2 = source2.get("raw_text", "")
    title1 = source1.get("title", "")
    title2 = source2.get("title", "")
    
    # Quick check: if titles are very similar, likely duplicate
    if title1 and title2:
        title_similarity = SequenceMatcher(None, title1.lower(), title2.lower()).ratio()
        if title_similarity > 0.9:
            return True
    
    # Content similarity check
    if text1 and text2:
        # Use first 500 chars for performance (most articles have unique openings)
        snippet1 = _normalize_content_for_hashing(text1[:500])
        snippet2 = _normalize_content_for_hashing(text2[:500])
        
        if len(snippet1) < 50 or len(snippet2) < 50:
            return False  # Not enough content to compare reliably
            
        content_similarity = SequenceMatcher(None, snippet1, snippet2).ratio()
        return content_similarity >= threshold
    
    return False


def analyze_deduplication_stats(original_sources: List[Dict], deduplicated_sources: List[Dict]) -> Dict:
    """Analyze deduplication effectiveness."""
    original_count = len(original_sources)
    final_count = len(deduplicated_sources)
    removed_count = original_count - final_count
    
    # Count by provider
    provider_stats = {}
    for source in original_sources:
        provider = source.get("search_provider", "unknown")
        provider_stats[provider] = provider_stats.get(provider, 0) + 1
    
    final_provider_stats = {}
    for source in deduplicated_sources:
        provider = source.get("search_provider", "unknown")
        final_provider_stats[provider] = final_provider_stats.get(provider, 0) + 1
    
    return {
        "original_count": original_count,
        "deduplicated_count": final_count,
        "duplicates_removed": removed_count,
        "deduplication_rate": round((removed_count / original_count * 100) if original_count > 0 else 0, 1),
        "original_by_provider": provider_stats,
        "final_by_provider": final_provider_stats
    }