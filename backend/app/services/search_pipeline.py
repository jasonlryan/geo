from __future__ import annotations

import asyncio
import os
from typing import List
import time
from collections import defaultdict

from .providers.base import ProviderResult
from .fetch_parse import fetch_and_parse
from .providers.tavily_provider import TavilySearchProvider
from .providers.openai_provider import OpenAISearchProvider
# from .providers.brave_provider import BraveSearchProvider  # Disabled due to rate limits
from .providers.perplexity_provider import PerplexityProvider
from .providers.gemini_provider import GeminiProvider
from .providers.consensus_merger import ConsensusResultMerger


async def expand_queries(base_query: str) -> List[str]:
    """
    Generate query variants using LLM for diverse search terms + authority bias.
    Combines AI-generated contextual queries with authority-focused variants.
    """
    variants = [base_query]  # Always include the original query
    
    # Generate LLM-based query expansions
    try:
        llm_variants = await generate_llm_query_variants(base_query)
        variants.extend(llm_variants[:2])  # Add top 2 LLM variants
    except Exception as e:
        print(f"[ERROR] LLM query expansion failed: {e}")
    
    # Add authority-favoring variants as fallback/complement
    authority_variants = [
        f'"{base_query}" (site:.gov OR site:.edu OR site:.org)',  # Favor authority domains
        f'{base_query} research paper OR policy OR white paper',   # Favor research content
    ]
    
    # MANDATORY: Always include at least one authority-biased variant
    mandatory_authority = f'{base_query} site:.gov OR site:.edu OR site:.org'
    if mandatory_authority not in variants:
        variants.append(mandatory_authority)
    
    # Add additional authority variants if we have room
    current_count = len(variants)
    remaining_authority = [v for v in authority_variants if v not in variants]
    if current_count < 4:
        variants.extend(remaining_authority[:4-current_count])
    
    return variants[:4]  # Limit to 4 total variants to avoid too many API calls


async def generate_llm_query_variants(base_query: str) -> List[str]:
    """
    Use OpenAI to generate diverse, contextually relevant query variants.
    """
    import asyncio
    import json
    from ..services.search_openai import openai_client
    
    def _call_llm() -> List[str]:
        try:
            client = openai_client()
            model = os.getenv("OPENAI_MODEL_SEARCH", "gpt-4o-mini")
            
            system = (
                "You are a search query expansion expert. Given a base query, generate 3 diverse, "
                "contextually relevant alternative search queries that would find different but related information. "
                "Focus on: 1) Different terminologies, 2) Related concepts, 3) Specific aspects. "
                "Avoid corporate marketing terms like 'trends', 'best practices', 'top 10'. "
                "Prefer academic, research-oriented, and authoritative language. "
                "Return as JSON: {\"variants\": [\"query1\", \"query2\", \"query3\"]}"
            )
            
            user_prompt = f"Base query: \"{base_query}\"\n\nGenerate 3 diverse search query variants."
            
            resp = client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,  # Higher creativity for diverse variants
                max_tokens=200
            )
            
            content = resp.choices[0].message.content
            data = json.loads(content)
            variants = data.get("variants", [])
            
            # Filter and clean variants
            cleaned_variants = []
            for variant in variants[:3]:
                if isinstance(variant, str) and variant.strip():
                    cleaned = variant.strip()
                    # Skip if too similar to original
                    if cleaned.lower() != base_query.lower():
                        cleaned_variants.append(cleaned)
            
            return cleaned_variants
            
        except Exception as e:
            print(f"[ERROR] OpenAI query expansion: {e}")
            return []
    
    return await asyncio.to_thread(_call_llm)


async def run_search(query: str, limit_per_query: int | None = None) -> List[ProviderResult]:
    """
    Multi-provider search with consensus tracking and weighted deduplication.
    Returns results with cross-provider consensus signals preserved.
    """
    if limit_per_query is None:
        limit_per_query = int(os.getenv("SEARCH_LIMIT_PER_QUERY", "15"))  # Reduced per provider due to more providers
    
    providers = []
    
    # Initialize all available providers with graceful error handling
    provider_configs = [
        (TavilySearchProvider, "Tavily"),
        (OpenAISearchProvider, "OpenAI"), 
        # (BraveSearchProvider, "Brave"),  # Temporarily disabled due to rate limits
        (PerplexityProvider, "Perplexity"),
        (GeminiProvider, "Gemini")
    ]
    
    for provider_class, provider_name in provider_configs:
        try:
            providers.append(provider_class())
            print(f"[INFO] Initialized {provider_name} search provider")
        except Exception as e:
            print(f"[WARNING] Failed to initialize {provider_name} provider: {e}")
            # Continue with other providers - don't fail entire search
    
    # Return empty if no providers available
    if not providers:
        print("[ERROR] No search providers available")
        return []
    
    print(f"[INFO] Running multi-provider search with {len(providers)} providers")
    variants = await expand_queries(query)

    # Rate limiting setup
    rate_limits = {
        # "brave": float(os.getenv("RATE_LIMIT_BRAVE", "0.5")),  # Disabled
        "tavily": float(os.getenv("RATE_LIMIT_TAVILY", "2")),
        "openai": float(os.getenv("RATE_LIMIT_OPENAI", "2")),
        "perplexity": float(os.getenv("RATE_LIMIT_PERPLEXITY", "1")),
        "gemini": float(os.getenv("RATE_LIMIT_GEMINI", "1"))
    }
    
    # Track last request time for each provider
    last_request_time = defaultdict(float)
    
    async def search_one(p, q: str) -> List[ProviderResult]:
        """Search one provider with one query variant with rate limiting."""
        # Apply rate limiting
        provider_name = p.name.lower()
        rate_limit = rate_limits.get(provider_name, 1.0)
        min_interval = 1.0 / rate_limit  # Convert to seconds between requests
        
        # Calculate delay needed
        current_time = time.time()
        time_since_last = current_time - last_request_time[provider_name]
        delay_needed = max(0, min_interval - time_since_last)
        
        if delay_needed > 0:
            print(f"[RATE_LIMIT] Waiting {delay_needed:.2f}s before {p.name} request...")
            await asyncio.sleep(delay_needed)
        
        # Update last request time
        last_request_time[provider_name] = time.time()
        
        try:
            results = await p.search(q, limit=limit_per_query)
            print(f"[INFO] {p.name} returned {len(results)} results for: {q[:50]}...")
            return results
        except Exception as e:
            print(f"[ERROR] Search failed for {p.name}: {e}")
            return []

    # Execute searches grouped by provider to respect rate limits better
    tasks = []
    provider_query_pairs = []
    
    # Group by provider to ensure rate limiting works properly
    for p in providers:
        # Create tasks for this provider sequentially to respect rate limits
        provider_tasks = []
        for q in variants:
            task = search_one(p, q)
            provider_tasks.append(task)
            provider_query_pairs.append((p.name, q))
        
        # Add all tasks for this provider
        tasks.extend(provider_tasks)
    
    results_lists = await asyncio.gather(*tasks)
    all_results: List[ProviderResult] = [r for lst in results_lists for r in lst]
    
    # Track provider performance and zero-result cases for debugging
    provider_performance = {}
    for (provider_name, query), results_list in zip(provider_query_pairs, results_lists):
        if provider_name not in provider_performance:
            provider_performance[provider_name] = {
                "queries_attempted": 0,
                "queries_with_results": 0,
                "total_results": 0,
                "zero_result_queries": []
            }
        
        stats = provider_performance[provider_name]
        stats["queries_attempted"] += 1
        stats["total_results"] += len(results_list)
        
        if len(results_list) == 0:
            stats["zero_result_queries"].append(query[:50] + "..." if len(query) > 50 else query)
        else:
            stats["queries_with_results"] += 1
    
    print(f"[INFO] Collected {len(all_results)} total results before consensus merging")
    
    # Log provider performance for debugging
    for provider_name, stats in provider_performance.items():
        success_rate = (stats["queries_with_results"] / stats["queries_attempted"] * 100) if stats["queries_attempted"] > 0 else 0
        print(f"[PROVIDER] {provider_name}: {success_rate:.1f}% success rate ({stats['queries_with_results']}/{stats['queries_attempted']} queries), {stats['total_results']} total results")
        if stats["zero_result_queries"]:
            print(f"[PROVIDER] {provider_name} zero results for: {stats['zero_result_queries']}")
    
    # Use ConsensusResultMerger instead of simple deduplication
    merger = ConsensusResultMerger()
    merged_results = merger.merge_provider_results(all_results)
    
    print(f"[INFO] After consensus merging: {len(merged_results)} unique results")
    
    # Convert ConsensusMergedResult back to ProviderResult for backward compatibility
    # while preserving consensus metadata
    final_results = []
    for merged in merged_results:
        # Create ProviderResult with consensus data embedded
        result = ProviderResult(
            title=merged.title,
            url=merged.url,
            snippet=merged.snippet,
            published_at=merged.published_at,
            provider=merged.primary_provider,
            score=max(merged.provider_scores.values()) * (1 + merged.consensus_boost)  # Apply consensus boost
        )
        
        # Preserve consensus metadata in the result object
        result.discovered_by = merged.discovered_by
        result.provider_scores = merged.provider_scores
        result.consensus_boost = merged.consensus_boost
        
        final_results.append(result)
    
    # Log consensus statistics for research insights
    consensus_stats = {
        "single_provider": len([r for r in final_results if len(r.discovered_by) == 1]),
        "dual_provider": len([r for r in final_results if len(r.discovered_by) == 2]), 
        "triple_plus_provider": len([r for r in final_results if len(r.discovered_by) >= 3]),
        "max_consensus": max(len(r.discovered_by) for r in final_results) if final_results else 0
    }
    print(f"[RESEARCH] Consensus stats: {consensus_stats}")
    
    # Return results with provider performance as a tuple
    return (final_results, provider_performance)


async def fetch_top(results: List[ProviderResult], *, max_docs: int | None = None) -> List[dict]:
    if max_docs is None:
        max_docs = int(os.getenv("FETCH_MAX_DOCS", "20"))
    
    # NO PRE-FILTERING - let TRUE citation selector decide based on content
    # reranked_results = await rerank_by_authority(results)  # REMOVED - was biasing toward .gov/.edu
    
    tasks = [fetch_and_parse(r.url) for r in results[:max_docs]]
    parsed = await asyncio.gather(*tasks)
    docs = []
    for r, p in zip(results[:max_docs], parsed):
        if not p:
            continue
        docs.append({
            "title": p.get("title") or r.title,  # Prefer extracted title over provider title
            "url": r.url,
            "snippet": r.snippet,
            "published_at": p.get("published_at") or r.published_at,  # Prefer extracted date
            "provider": r.provider,  # Track which search provider found this source
            "raw_text": p["text"],
            "author": p.get("author", ""),
            "extraction_method": p.get("extraction_method", "unknown"),
            "content_length": p.get("content_length", 0),
            "search_provider": r.provider,  # Explicit field for provider attribution analysis
            # NO HARDCODED CREDIBILITY - let TRUE citation selector decide
            # "credibility_score": REMOVED
            # "credibility_band": REMOVED
            # "credibility_category": REMOVED
            # "credibility_factors": REMOVED
            # Preserve consensus data
            "discovered_by": r.discovered_by,
            "provider_scores": r.provider_scores,
            "consensus_boost": r.consensus_boost,
        })
    return docs


async def rerank_by_authority(results: List[ProviderResult]) -> List[ProviderResult]:
    """
    Re-rank search results to prioritize authoritative sources over corporate blogs.
    Based on review2 feedback: ensure gov/edu/research sources come first.
    """
    from ..utils.source_categorization import categorize_source, calculate_credibility_score
    from urllib.parse import urlparse
    
    scored_results = []
    
    for result in results:
        # Extract domain for categorization
        try:
            domain = urlparse(result.url).netloc.lower()
            domain = domain.replace("www.", "")
        except:
            domain = ""
        
        # Categorize the source
        category = categorize_source(domain, "")
        
        # Calculate credibility score (using stub data since we haven't fetched yet)
        credibility_data = calculate_credibility_score(
            domain=domain,
            category=category,
            published_at=result.published_at,
            content_length=1000,  # Estimate for ranking purposes
            author="",  # Not available at this stage
            title=result.title
        )
        
        authority_score = credibility_data["score"]
        
        # DISABLED: No more hardcoded category boosts - let TRUE citation selector decide
        # category_boosts = {...}  # REMOVED
        
        # Use base credibility score without hardcoded domain bias
        final_score = authority_score
        
        # Store credibility data in the result for later use
        result.credibility_score = authority_score
        result.credibility_band = credibility_data["band"]
        result.credibility_category = category
        result.credibility_factors = credibility_data["factors"]
        
        scored_results.append((final_score, result))
    
    # Sort by score descending (highest authority first)
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    return [result for score, result in scored_results]

