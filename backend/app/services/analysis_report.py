from __future__ import annotations

from typing import Any, Dict, List


def _nl(s: str) -> str:
    return s if s.endswith("\n") else s + "\n"


def build_markdown_report(bundle: Dict[str, Any], llm: Dict[str, Any] | None = None) -> str:
    run = bundle.get("run") or {}
    sources = bundle.get("sources") or []
    analysis = (bundle.get("analysis") or {})

    lines: List[str] = []
    lines.append(_nl(f"# Citation Analysis Report"))
    lines.append(_nl(f"- Query: {run.get('query','')}"))
    lines.append(_nl(f"- Run ID: {run.get('run_id','')}"))

    funnel = analysis.get("funnel") or {}
    lines.append(_nl("\n## Funnel"))
    lines.append(_nl(f"Proposed: {funnel.get('proposed','?')} · Fetched: {funnel.get('fetched','?')} · Cited: {funnel.get('cited','?')}"))

    # Cited sources list
    lines.append(_nl("\n## Cited sources"))
    for i, s in enumerate(sources, start=1):
        title = s.get("title") or s.get("url")
        url = s.get("url") or ""
        domain = s.get("domain") or ""
        band = ((s.get("credibility") or {}).get("score") or "")
        lines.append(_nl(f"{i}. {title} — {domain} — {url} (cred {band})"))

    # Top domains
    if analysis.get("mix"):
        lines.append(_nl("\n## Source mix"))
        top = analysis.get("mix", {}).get("domains_top", [])
        if top:
            lines.append(_nl("### Top domains"))
            for d, c in top:
                lines.append(_nl(f"- {d} — {c}"))

    # LLM analysis
    if llm:
        a = llm.get("analysis") or {}
        lines.append(_nl("\n## LLM citation analysis"))
        # Risks
        risks = a.get("risks") or []
        if risks:
            lines.append(_nl("### Risks"))
            for r in risks:
                lines.append(_nl(f"- {r}"))
        # Recommendations
        recs = a.get("recommendations") or []
        if recs:
            lines.append(_nl("### Recommendations"))
            for r in recs:
                lines.append(_nl(f"- {r}"))
        # Mix
        mix = a.get("mix") or {}
        if mix:
            lines.append(_nl("### Mix"))
            for section in ("type", "credibility_band", "geography"):
                if section in mix:
                    lines.append(_nl(f"- {section}:"))
                    for k, v in (mix.get(section) or {}).items():
                        lines.append(_nl(f"  - {k}: {v}"))

    return "".join(lines)


