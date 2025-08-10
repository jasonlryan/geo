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

    Returns a dict: { "answer_text": str, "sentences": [{"text": str, "source_ids": [str]}] }
    """
    model = os.getenv("OPENAI_MODEL_COMPOSER", "gpt-4o-mini")
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

