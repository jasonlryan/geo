from __future__ import annotations

import json
import os
from typing import Any, Dict, List

from openai import OpenAI


def _openai() -> OpenAI:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=key)


def _load_prompt() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(here, "..", "..", "prompts", "citation_analysis.md")
    with open(os.path.normpath(prompt_path), "r", encoding="utf-8") as f:
        return f.read()


def build_analysis_input(bundle: Dict[str, Any]) -> Dict[str, Any]:
    query = (bundle.get("run") or {}).get("query")
    sources = bundle.get("sources", [])
    claims = bundle.get("claims", [])
    evidence = bundle.get("evidence", [])

    # Prioritize cited sources, then fill up to a small cap with top non-cited
    # Keep token usage low for latency/cost
    cited_ids = {e.get("source_id") for e in evidence if e.get("source_id")}
    cited = [s for s in sources if s.get("source_id") in cited_ids]
    non_cited = [s for s in sources if s.get("source_id") not in cited_ids]
    # Cap: all cited + top 5 non-cited, but never exceed 12 total
    limited = (cited + non_cited[:5])[:12]

    def to_source(s: Dict[str, Any]) -> Dict[str, Any]:
        # Keep snippets compact to reduce tokens (≈ 800–1200 chars)
        text = (s.get("raw_text") or "")[:1200]
        
        # Import classification functions
        from ..utils.source_categorization import classify_authority, classify_recency
        
        # Enhanced source data for better intelligence analysis
        credibility_score = s.get("credibility", {}).get("score", 0.0)
        
        return {
            "source_id": s.get("source_id"),
            "url": s.get("url"),
            "domain": s.get("domain"),
            "title": s.get("title"),
            "published_at": s.get("published_at"),
            "media_type": s.get("media_type"),
            "source_category": s.get("category"),           # Business categorization
            "credibility_score": credibility_score,         # Authority signal
            "authority_level": classify_authority(credibility_score), # High/medium/low
            "recency_category": classify_recency(s.get("published_at")), # Recent/medium/stale
            "author": s.get("author"),                      # Authority signal
            "publisher": s.get("publisher"),                # Authority signal
            "word_count": s.get("word_count"),              # Content depth signal
            "paywall": s.get("paywall", False),             # Accessibility signal
            "text_snippet": text,
        }

    # Extract subject and search model context
    run_data = bundle.get("run", {})
    subject = run_data.get("subject")
    search_model = run_data.get("search_model")
    
    input_payload = {
        "query": query,
        "subject": subject,                      # Subject context for business intelligence
        "search_model": search_model,            # Search provider context
        "sources": [to_source(s) for s in limited],
        "claims": [
            {
                "claim_id": c.get("claim_id"),
                "text": c.get("text"),
                "answer_sentence_index": c.get("answer_sentence_index"),
            }
            for c in claims
        ],
        "evidence": [
            {
                "claim_id": e.get("claim_id"),
                "source_id": e.get("source_id"),
                "snippet": e.get("snippet"),
            }
            for e in evidence
        ],
        "funnel": (bundle.get("analysis") or {}).get("funnel"),  # Now available with analysis
    }
    return input_payload


def generate_citation_analysis(bundle: Dict[str, Any]) -> Dict[str, Any] | None:
    try:
        system_prompt = _load_prompt()
    except Exception:
        return None

    model = os.getenv("OPENAI_MODEL_ANALYSIS", "gpt-4o-mini")
    client = _openai()
    input_json = build_analysis_input(bundle)

    try:
        resp = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(input_json)},
            ],
            temperature=0.1,
        )
        content = resp.choices[0].message.content
        data = json.loads(content)
        return data
    except Exception:
        return None


