from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Protocol, Optional, Dict


@dataclass
class ProviderResult:
    title: str
    url: str
    snippet: Optional[str] = None
    published_at: Optional[str] = None  # ISO string
    provider: str = "unknown"
    score: float = 0.0
    # Multi-provider consensus tracking
    discovered_by: List[str] = field(default_factory=list)  # ["tavily", "brave", "bing"]
    provider_scores: Dict[str, float] = field(default_factory=dict)  # {provider: score}
    consensus_boost: float = 0.0  # Calculated credibility boost from cross-provider selection
    
    def calculate_consensus_boost(self) -> float:
        """Calculate credibility boost based on cross-provider consensus."""
        provider_count = len(self.discovered_by)
        if provider_count <= 1:
            return 0.0
        elif provider_count == 2:
            return 0.15  # 15% boost for dual-provider consensus
        elif provider_count >= 3:
            return 0.25  # 25% boost for strong consensus (3+ providers)
        return 0.0
    
    def update_consensus_boost(self) -> None:
        """Update the consensus boost based on current discovered_by list."""
        self.consensus_boost = self.calculate_consensus_boost()
    
    def add_provider_discovery(self, provider_name: str, provider_score: float) -> None:
        """Add a provider discovery with deduplication."""
        if provider_name not in self.discovered_by:
            self.discovered_by.append(provider_name)
            self.provider_scores[provider_name] = provider_score
            self.update_consensus_boost()


@dataclass 
class ConsensusMergedResult:
    """Merged result from multiple providers with consensus metadata."""
    title: str
    url: str
    snippet: Optional[str] = None
    published_at: Optional[str] = None
    discovered_by: List[str] = field(default_factory=list)
    provider_scores: Dict[str, float] = field(default_factory=dict)
    consensus_boost: float = 0.0
    primary_provider: str = "unknown"  # Provider with highest score
    authority_signals: Dict[str, any] = field(default_factory=dict)  # Additional metadata


class SearchProvider(Protocol):
    name: str

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        ...

