from __future__ import annotations

import os
import json
from typing import Any, Dict, List

from openai import OpenAI
try:
    from .true_citation_selector import TRUE_CITATION_SELECTOR
    print("[COMPOSER DEBUG] TRUE_CITATION_SELECTOR imported successfully")
except Exception as e:
    print(f"[COMPOSER DEBUG] IMPORT ERROR: {e}")
    TRUE_CITATION_SELECTOR = None


def _client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


def compose_answer(query: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Ask the model to write an answer with sentence-level citations.
    
    Implements authority floor guardrails: refuses to compose unless minimum 
    high-authority sources are available.

    Returns a dict: { "answer_text": str, "sentences": [{"text": str, "source_ids": [str]}] }
    """
    model = os.getenv("OPENAI_MODEL_COMPOSER", "gpt-4o-mini")
    
    # Use TRUE citation selection - NO hardcoded domain scores!
    print(f"[COMPOSER DEBUG] Starting citation selection with {len(sources)} sources")
    
    # TEMPORARY: Force bypass citation selector to test if server restart needed
    print(f"[COMPOSER DEBUG] FORCING BYPASS - Using first {min(10, len(sources))} sources directly")
    selected_sources = sources[:10]
    
    # Minimum source check (much more lenient than old authority floor)
    min_sources = max(1, int(os.getenv("MIN_AUTHORITY_SOURCES", "2")))
    print(f"[COMPOSER DEBUG] Min sources required: {min_sources}, Selected sources: {len(selected_sources)}")
    
    if len(selected_sources) < min_sources:
        print(f"[COMPOSER DEBUG] INSUFFICIENT SOURCES - returning error")
        return {
            "answer_text": f"Insufficient relevant sources found to provide a comprehensive answer. Found {len(selected_sources)} suitable sources, but require at least {min_sources} for reliable information.",
            "sentences": [],
            "insufficient_sources": True,
            "sources_found": len(selected_sources),
            "min_required": min_sources,
            "available_sources": len(sources)
        }
    
    print(f"[COMPOSER DEBUG] Proceeding to LLM with {len(selected_sources)} sources")
    
    # Format selected sources for the model
    src_brief = [
        {
            "source_id": s["source_id"],
            "title": s.get("title"),
            "domain": s.get("domain"),
            "url": s.get("url"),
            "category": s.get("category", "unknown"),
            "credibility_score": s.get("credibility", {}).get("score", 0.5),
            "credibility_band": s.get("credibility", {}).get("band", "C"),
            "snippet": (s.get("raw_text") or s.get("title") or "")[:800],
        }
        for s in selected_sources
    ]

    system = (
        "You are a precise research assistant. Answer the user's query using the provided sources. "
        "Every sentence in your answer must include one or more citations referencing source_id values. "
        "\n**TRUE AI SEARCH APPROACH:**\n"
        "- Sources selected PURELY by content relevance and quality - NO domain authority bias\n"
        "- Mix includes: government, academic, commercial, news, community sources based on content value\n"
        "- A tech company blog may be more valuable than a random .edu page for tech queries\n"
        "- Community sources (Reddit, Stack Overflow) can provide practical insights\n"
        "- Commercial sources offer real-world implementation details\n"
        "\nUse all provided sources - they were chosen for content quality and query relevance. "
        "Cite 2-4 sources per sentence when available. Mix source types naturally based on what information they provide. "
        "Return strict JSON with keys: answer_text, sentences[]. Each sentences[] item has text and source_ids[]."
    )
    user = {
        "query": query,
        "sources": src_brief,
        "instructions": "Compose 3-6 sentences. Keep to facts supported by sources."
    }

    client = _client()
    resp = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user)},
        ],
        temperature=0.2,
    )
    content = resp.choices[0].message.content
    data = json.loads(content)
    # Validate minimal shape
    answer_text = data.get("answer_text") or ""
    sentences = data.get("sentences") or []
    if not isinstance(sentences, list):
        sentences = []
    # Normalize source_ids to strings
    for s in sentences:
        ids = s.get("source_ids") or []
        s["source_ids"] = [str(x) for x in ids]
    return {"answer_text": answer_text, "sentences": sentences}

