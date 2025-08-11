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
    
    # TRUE citation selection with passage grounding
    print(f"[COMPOSER DEBUG] Starting citation selection with {len(sources)} sources")
    desired_k = 3
    if TRUE_CITATION_SELECTOR:
        try:
            desired_k = TRUE_CITATION_SELECTOR.target_citations_for(query)
        except Exception:
            desired_k = 3
    
    if TRUE_CITATION_SELECTOR:
        selected_sources = TRUE_CITATION_SELECTOR.select_citations(query, sources, target_count=desired_k)
        if not selected_sources:
            selected_sources = sources[:desired_k]
    else:
        selected_sources = sources[:desired_k]
    
    # Minimum source check (lenient)
    min_sources = max(1, int(os.getenv("MIN_AUTHORITY_SOURCES", "1")))
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
    
    # Simple abstain heuristic if passages are weak
    try:
        avg_pass = sum((s.get("_best_passage", {}) or {}).get("score", 0.0) for s in selected_sources) / max(1, len(selected_sources))
    except Exception:
        avg_pass = 0.0
    
    if avg_pass < 1.2 and len(selected_sources) < 2:
        print(f"[COMPOSER DEBUG] Abstaining due to weak passages. avg_pass={avg_pass:.2f}, sources={len(selected_sources)}")
        return {
            "answer_text": "I couldn't find strong, directly relevant passages to answer this confidently.",
            "sentences": [],
            "insufficient_sources": True,
            "available_sources": len(sources)
        }
    
    print(f"[COMPOSER DEBUG] Proceeding to LLM with {len(selected_sources)} sources (k={desired_k})")
    
    # Format selected sources for the model
    src_brief = [
        {
            "source_id": s["source_id"],
            "title": s.get("title"),
            "domain": s.get("domain"),
            "url": s.get("url"),
            # composer is STRICTLY passage-grounded:
            "passage": (s.get("_best_passage") or {}).get("text") or (s.get("raw_text") or "")[:800],
        }
        for s in selected_sources
    ]

    system = (
        "You are a precise research assistant. Use ONLY the provided passages to answer the user's query.\n"
        "- Every sentence MUST include 1–3 citations referencing source_id values.\n"
        "- If a statement is not directly supported by a passage, do not include it.\n"
        "- Keep it concise (3–6 sentences), factual, and grounded.\n"
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
    
    # Normalize shape & keys (handle sourceIds / citations / numeric indices)
    raw_sentences = data.get("sentences") or data.get("Sentences") or []
    sentences = []
    id_map = {i + 1: s["source_id"] for i, s in enumerate(selected_sources)}
    
    for item in raw_sentences:
        ids = item.get("source_ids") or item.get("sourceIds") or item.get("citations") or []
        # map numeric refs (1-based) to source_ids
        if ids and all(isinstance(x, (int, float)) for x in ids):
            ids = [id_map.get(int(x)) for x in ids if id_map.get(int(x))]
        ids = [str(x) for x in ids if x]
        if ids and (item.get("text") or "").strip():
            sentences.append({"text": item["text"].strip(), "source_ids": ids})
    
    # Clean answer_text - let UI handle citation formatting from sentences[]
    answer_text = " ".join(s['text'] for s in sentences)
    return {"answer_text": answer_text, "sentences": sentences}

