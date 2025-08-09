import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from ..core.db import get_session
from ..models import Run, Source, Claim, Evidence, Classification


class Store:
    def __init__(self) -> None:
        # In-memory fallback mirror for the full trace blob
        self._mem: Dict[str, Dict[str, Any]] = {}

    def create_run(self, bundle: Dict[str, Any]) -> str:
        run_data = bundle["run"]
        run_id = run_data.get("run_id") or str(uuid.uuid4())
        run_data["run_id"] = run_id
        self._mem[run_id] = bundle
        with get_session() as s:
            s.add(
                Run(
                    run_id=run_id,
                    query=run_data["query"],
                    created_at=_parse_ts(run_data["created_at"]),
                    params_json=json.dumps(run_data.get("params") or {}),
                    timings_json=json.dumps(run_data.get("timings") or {}),
                    answer_text=(bundle.get("answer") or {}).get("text"),
                )
            )
            for src in bundle.get("sources", []):
                s.add(
                    Source(
                        source_id=src["source_id"],
                        run_id=run_id,
                        url=src.get("url"),
                        canonical_url=src.get("canonical_url"),
                        domain=src.get("domain"),
                        title=src.get("title"),
                        author=src.get("author"),
                        publisher=src.get("publisher"),
                        published_at=_parse_ts_opt(src.get("published_at")),
                        accessed_at=_parse_ts_opt(src.get("accessed_at")),
                        media_type=src.get("media_type"),
                        geography=src.get("geography"),
                        paywall=src.get("paywall"),
                        credibility_json=json.dumps(src.get("credibility") or {}),
                        content_hash=src.get("content_hash"),
                        word_count=src.get("word_count"),
                        raw_text=src.get("raw_text"),
                    )
                )
            for c in bundle.get("claims", []):
                s.add(
                    Claim(
                        claim_id=c["claim_id"],
                        run_id=run_id,
                        text=c["text"],
                        importance=c.get("importance"),
                        answer_sentence_index=c.get("answer_sentence_index"),
                    )
                )
            for e in bundle.get("evidence", []):
                s.add(
                    Evidence(
                        claim_id=e["claim_id"],
                        source_id=e["source_id"],
                        coverage_score=e.get("coverage_score"),
                        stance=e.get("stance"),
                        snippet=e.get("snippet"),
                        start_offset=e.get("start_offset"),
                        end_offset=e.get("end_offset"),
                    )
                )
            for k in bundle.get("classifications", []):
                s.add(
                    Classification(
                        source_id=k["source_id"],
                        label_key=k["label_key"],
                        label_value=k.get("label_value"),
                        confidence=k.get("confidence"),
                    )
                )
            s.commit()
        return run_id

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        return self._mem.get(run_id)

    def list_runs(self) -> Dict[str, Dict[str, Any]]:
        return self._mem


STORE = Store()


def _parse_ts(ts: str) -> datetime:
    # Handle "...Z" suffix ISO strings
    if ts.endswith("Z"):
        ts = ts[:-1]
    return datetime.fromisoformat(ts)


def _parse_ts_opt(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    if ts.endswith("Z"):
        ts = ts[:-1]
    return datetime.fromisoformat(ts)

