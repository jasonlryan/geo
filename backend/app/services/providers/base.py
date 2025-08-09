from __future__ import annotations

from dataclasses import dataclass
from typing import List, Protocol, Optional


@dataclass
class ProviderResult:
    title: str
    url: str
    snippet: Optional[str] = None
    published_at: Optional[str] = None  # ISO string
    provider: str = "unknown"
    score: float = 0.0


class SearchProvider(Protocol):
    name: str

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        ...

