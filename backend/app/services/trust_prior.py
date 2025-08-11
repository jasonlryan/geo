# backend/app/services/trust_prior.py

from typing import Dict, Tuple
from ..core.cache import CACHE


def domain_reliability(domain: str) -> float:
    """
    Rolling prior in [0.4 .. 0.9] based on (citations / appearances) learned from your own runs.
    """
    if not domain:
        return 0.5
    key = CACHE.ai_key(f"trust:domain:{domain.lower()}:ratio")
    try:
        r = float(CACHE.get(key) or "0")
    except Exception:
        r = 0.0
    return 0.4 + max(0.0, min(0.5, r * 0.5))  # compress toward middle, cap at 0.9


def update_domain_reliability(stats: Dict[str, Tuple[int, int]]) -> None:
    """
    stats: {domain: (appearances, cited)}
    Call once per run to update priors.
    """
    for d, (appearances, cited) in stats.items():
        if appearances <= 0:
            continue
        ratio = max(0.0, min(1.0, cited / appearances))
        CACHE.set(CACHE.ai_key(f"trust:domain:{d.lower()}:ratio"), str(ratio), ttl=-1)