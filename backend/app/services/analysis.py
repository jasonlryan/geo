from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List, Set


def compute_analysis(bundle: Dict[str, Any]) -> Dict[str, Any]:
    sources: List[Dict[str, Any]] = bundle.get("sources", [])
    evidence: List[Dict[str, Any]] = bundle.get("evidence", [])
    provider_results: List[Dict[str, Any]] = bundle.get("provider_results", [])
    fetched_docs: List[Dict[str, Any]] = bundle.get("fetched_docs", [])

    proposed_urls: Set[str] = {r.get("url", "") for r in provider_results if r.get("url")}
    fetched_urls: Set[str] = {d.get("url", "") for d in fetched_docs if d.get("url")}

    cited_source_ids: Set[str] = {e.get("source_id", "") for e in evidence if e.get("source_id")}

    # Map source_id -> url/domain/media_type/cred band
    id_to_source = {s.get("source_id"): s for s in sources}
    cited_urls: Set[str] = set()
    for sid in cited_source_ids:
        src = id_to_source.get(sid)
        if src and src.get("url"):
            cited_urls.add(src["url"])

    # Funnel counts
    funnel = {
        "proposed": len(proposed_urls),
        "fetched": len(fetched_urls),
        "cited": len(cited_source_ids),
    }

    # Mix counters
    domains = [s.get("domain") for s in sources if s.get("domain")]
    media_types = [s.get("media_type") for s in sources if s.get("media_type")]
    cred_bands = []
    for s in sources:
        cred = (s.get("credibility") or {}).get("score")
        if isinstance(cred, (int, float)):
            band = "A" if cred >= 0.8 else ("B" if cred >= 0.6 else ("C" if cred >= 0.4 else "D"))
            cred_bands.append(band)

    mix = {
        "domains_top": Counter(domains).most_common(10),
        "media_type": Counter(media_types),
        "credibility_band": Counter(cred_bands),
    }

    # Coverage per claim (count of supporting sources)
    coverage_per_claim: Dict[str, int] = {}
    for e in evidence:
        cid = e.get("claim_id")
        if not cid:
            continue
        coverage_per_claim[cid] = coverage_per_claim.get(cid, 0) + 1

    return {
        "funnel": funnel,
        "mix": mix,
        "cited_urls": list(cited_urls),
        "proposed_urls": list(proposed_urls),
        "fetched_urls": list(fetched_urls),
        "coverage_per_claim": coverage_per_claim,
    }

