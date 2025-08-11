# backend/app/services/passage_ranker.py

import re
from math import log
from typing import List, Dict, Tuple


def _tokenize(s: str) -> List[str]:
    return re.findall(r'\w+', (s or "").lower())


def split_passages(text: str, window: int = 400, stride: int = 220) -> List[Tuple[int, str]]:
    if not text:
        return []
    chunks: List[Tuple[int, str]] = []
    for i in range(0, len(text), stride):
        chunk = text[i:i + window]
        if len(chunk) > 80:  # skip tiny chunks
            chunks.append((i, chunk))
    return chunks


def bm25_best_passage(query: str, text: str) -> Dict:
    """
    Lightweight, corpus-free BM25-ish scoring to find the best passage in a single document.
    Returns: {"score": float, "offset": int, "text": str}
    """
    q = _tokenize(query)
    if not q or not text:
        return {"score": 0.0, "offset": 0, "text": ""}
    
    chunks = split_passages(text)
    best = (0.0, 0, "")
    for off, chunk in chunks:
        toks = _tokenize(chunk)
        if not toks:
            continue
        # crude TF (per chunk) with log dampening; small coverage bonus
        tf = sum(toks.count(t) for t in set(q))
        coverage = len(set(q) & set(toks)) / max(1, len(set(q)))
        score = log(1 + tf) * (1 + min(1.0, coverage))
        if score > best[0]:
            best = (score, off, chunk)
    
    return {"score": float(best[0]), "offset": best[1], "text": best[2][:800]}