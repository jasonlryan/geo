from __future__ import annotations

import os
import json
from typing import Any, Dict, List

from openai import OpenAI


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
    
    # Authority floor configuration
    min_authority_sources = int(os.getenv("MIN_AUTHORITY_SOURCES", "2"))
    authority_floor_enabled = os.getenv("AUTHORITY_FLOOR_ENABLED", "true").lower() == "true"
    
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
        for s in sources
    ]
    
    # Apply authority floor guardrails
    if authority_floor_enabled:
        high_authority_sources = [
            s for s in src_brief 
            if s["credibility_band"] in ["A", "B"] or s["credibility_score"] >= 0.6
        ]
        
        if len(high_authority_sources) < min_authority_sources:
            # Return insufficient authority response instead of composing with low-quality sources
            return {
                "answer_text": f"Insufficient high-authority sources available to provide a reliable answer. Found {len(high_authority_sources)} authoritative sources, but require at least {min_authority_sources}. Consider expanding the search or using authority-biased query variants.",
                "sentences": [],
                "authority_floor_triggered": True,
                "high_authority_count": len(high_authority_sources),
                "min_required": min_authority_sources,
                "available_sources": len(src_brief)
            }

    system = (
        "You are a precise research assistant. Answer the user's query using the provided sources. "
        "Every sentence in your answer must include one or more citations referencing source_id values. "
        "\n**AUTHORITY PRIORITIZATION:**\n"
        "- STRONGLY prefer citing gov/edu/research sources (credibility_score ≥0.8) over corporate sources\n"
        "- Require at least one high-authority citation (gov/edu/research) per sentence when available\n"
        "- Avoid citing corporate blogs or marketing content unless they contain unique primary data\n"
        "- When multiple sources support a claim, prioritize: gov > edu > research > news > consultancy > corporate\n"
        "\nPrefer citing multiple independent sources (different domains). Aim for ≥2 citations per sentence when available, "
        "and at least 4 unique sources across the whole answer if possible. "
        "If few sources are available, cite all relevant ones. "
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

