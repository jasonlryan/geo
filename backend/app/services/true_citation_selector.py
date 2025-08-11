"""
True AI Citation Selector - content-first citation selection with passage grounding.
Adds:
- best-passage scoring (Perplexity/SGE style)
- optional trust prior blended with consensus (no hardcoded domain lists)
- intent-aware K (how many citations) and gentler diversity by query type
"""

import re
from typing import List, Dict, Any, Set, Tuple
from collections import defaultdict, Counter
import math
import os
from .passage_ranker import bm25_best_passage
from .trust_prior import domain_reliability


class TrueCitationSelector:
    def __init__(self):
        # diversity defaults; some are adjusted dynamically based on K
        self.diversity_requirements = {
            "minimum_diversity": 3,  # At least 3 different domain types
            "max_same_domain": 3,    # default; will scale with target_count
            "prefer_different_tlds": True
        }
        self.use_trust_prior = os.getenv("TRUE_USE_TRUST_PRIOR", "false").lower() == "true"

    # --- intent heuristics (SGE-like) ---
    def target_citations_for(self, query: str) -> int:
        q = (query or "").lower()
        if any(w in q for w in ["latest", "today", "breaking", "now", "2024", "2025", "news", "update"]):
            return 5
        if any(w in q for w in ["how to", "guide", "setup", "implement", "api", "error", "fix", "configure"]):
            return 4
        if any(w in q for w in ["compare", "vs", "pros", "cons", "which", "best"]):
            return 4
        return 3

    def calculate_content_relevance_score(self, query: str, source: Dict[str, Any]) -> float:
        """Calculate how well the content actually answers the query - NO domain bias"""
        query_lower = query.lower()
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        
        # Get all source content
        title = source.get('title', '').lower()
        content = source.get('raw_text', '')[:2000].lower()  # First 2000 chars
        url = source.get('url', '').lower()
        
        # Title relevance (most important - like search engines)
        title_words = set(re.findall(r'\b\w+\b', title))
        title_overlap = len(query_words & title_words)
        title_score = min(1.0, title_overlap / max(len(query_words), 1)) * 0.5
        
        # Content relevance
        content_words = set(re.findall(r'\b\w+\b', content))
        content_overlap = len(query_words & content_words) 
        content_score = min(1.0, content_overlap / max(len(query_words), 1)) * 0.3
        
        # URL semantic match
        url_clean = re.sub(r'[^\w\s]', ' ', url)
        url_words = set(re.findall(r'\b\w+\b', url_clean))
        url_overlap = len(query_words & url_words)
        url_score = min(1.0, url_overlap / max(len(query_words), 1)) * 0.2
        
        return title_score + content_score + url_score

    def calculate_content_quality_score(self, source: Dict[str, Any]) -> float:
        """Evaluate content quality based on actual content signals, not domain"""
        score = 0.5  # Neutral base
        
        title = source.get('title', '')
        content = source.get('raw_text', '')
        
        # Content depth
        content_length = len(content)
        if content_length >= 3000:
            score += 0.15  # Substantial content
        elif content_length >= 1500:
            score += 0.10  # Good content
        elif content_length >= 500:
            score += 0.05  # Adequate content
        elif content_length < 200:
            score -= 0.10  # Thin content penalty
        
        # Structured content (AI search engines love this)
        structure_signals = ['step', '1.', '2.', '•', 'how to', 'guide', 'tutorial', 
                           'comparison', 'vs', 'analysis', 'research', 'study', 'findings']
        structure_count = sum(1 for signal in structure_signals if signal in content.lower())
        score += min(0.15, structure_count * 0.03)
        
        # Title quality
        if title:
            # Descriptive titles
            if any(word in title.lower() for word in ['how', 'what', 'why', 'guide', 'analysis']):
                score += 0.05
            
            # Avoid clickbait
            clickbait = ['shocking', 'unbelievable', 'you won\'t believe', 'this one trick', 
                        'doctors hate', 'amazing', 'incredible', 'must see']
            if any(bait in title.lower() for bait in clickbait):
                score -= 0.15
        
        # Recent content gets small boost
        published_at = source.get('published_at')
        if published_at:
            try:
                from datetime import datetime
                if published_at.endswith('Z'):
                    pub_date = datetime.fromisoformat(published_at[:-1] + '+00:00')
                else:
                    pub_date = datetime.fromisoformat(published_at)
                
                now = datetime.now(pub_date.tzinfo) if pub_date.tzinfo else datetime.now()
                days_old = (now - pub_date).days
                
                if days_old <= 90:  # 3 months
                    score += 0.05
                elif days_old <= 365:  # 1 year
                    score += 0.02
            except:
                pass
        
        return min(1.0, max(0.0, score))

    def calculate_consensus_score(self, source: Dict[str, Any]) -> float:
        """Multi-provider consensus - sources found by multiple engines are better"""
        providers = source.get('search_providers') or source.get('discovered_by') or []
        provider_count = len(providers)
        
        if provider_count >= 3:
            return 1.0  # Strong consensus
        elif provider_count == 2:
            return 0.75  # Good consensus
        else:
            return 0.5   # Single provider

    def get_domain_type(self, domain: str) -> str:
        """Classify domain type for diversity - NO authority scoring!"""
        domain = domain.lower()
        
        if domain.endswith('.gov') or domain.endswith('.int'):
            return 'government'
        elif domain.endswith('.edu'):
            return 'academic'
        elif domain.endswith('.org'):
            return 'nonprofit'
        elif any(community in domain for community in ['reddit', 'stackoverflow', 'quora', 'github']):
            return 'community'
        elif any(news in domain for news in ['reuters', 'bloomberg', 'cnn', 'bbc', 'techcrunch', 'wired', 'verge']):
            return 'news'
        elif domain.endswith('.com') or domain.endswith('.io'):
            return 'commercial'
        else:
            return 'other'

    def enforce_realistic_diversity(self, scored_sources: List[Tuple[Dict[str, Any], float]], 
                                   target_count: int = 10) -> List[Dict[str, Any]]:
        """Enforce diversity like real AI search engines - NO domain authority bias"""
        
        if not scored_sources:
            return []
        
        # Sort by composite score
        scored_sources.sort(key=lambda x: x[1], reverse=True)
        
        selected = []
        domain_counts = defaultdict(int)
        domain_type_counts = defaultdict(int)
        used_domains = set()
        # scale cap by K (allow a bit more from same domain when K is small)
        dynamic_cap = max(1, min(self.diversity_requirements['max_same_domain'], target_count - 1))
        
        # First pass: Select top sources with diversity constraints
        for source, score in scored_sources:
            if len(selected) >= target_count:
                break
                
            domain = source.get('domain', '').lower()
            domain_type = self.get_domain_type(domain)
            
            # Skip if we already have too many from this domain
            if domain_counts[domain] >= dynamic_cap:
                continue
            
            # Prefer different domain types for diversity
            if len(selected) >= 3:  # After first 3, enforce diversity
                # Skip if we have too many of this domain type
                if domain_type_counts[domain_type] >= 4:
                    continue
            
            selected.append(source)
            domain_counts[domain] += 1
            domain_type_counts[domain_type] += 1
            used_domains.add(domain)
        
        # If we don't have enough, fill remaining slots with best remaining sources
        if len(selected) < target_count:
            remaining_slots = target_count - len(selected)
            remaining_sources = [
                source for source, score in scored_sources 
                if source.get('source_id') not in {s.get('source_id') for s in selected}
            ]
            
            for source in remaining_sources[:remaining_slots]:
                selected.append(source)
        
        return selected[:target_count]

    def select_citations(self, query: str, sources: List[Dict[str, Any]], 
                        target_count: int = 10) -> List[Dict[str, Any]]:
        """
        Select citations based PURELY on content quality and query relevance.
        NO hardcoded domain authority scores!
        """
        if not sources:
            return []
        
        print(f"[DEBUG] Citation selector processing {len(sources)} sources")
        
        # Debug: show first source structure
        if sources:
            first_source = sources[0]
            print(f"[DEBUG] First source keys: {list(first_source.keys())}")
            print(f"[DEBUG] First source domain: {first_source.get('domain', 'MISSING')}")
            print(f"[DEBUG] First source title: {first_source.get('title', 'MISSING')}")
        
        # intent-aware K override if caller left default
        if target_count == 10:
            target_count = self.target_citations_for(query)
        
        scored_sources: List[Tuple[Dict[str, Any], float]] = []
        
        for source in sources:
            # Pure content-based scoring
            relevance_score = self.calculate_content_relevance_score(query, source)
            quality_score = self.calculate_content_quality_score(source)
            consensus_score = self.calculate_consensus_score(source)
            # Passage-level evidence (best passage)
            bestp = bm25_best_passage(query, source.get("raw_text", ""))
            source["_best_passage"] = bestp
            passage_score = min(1.0, bestp["score"] / 6.0)  # simple scaling
            
            # Optional trust prior blended with consensus (still content-first)
            trust = 0.5
            if self.use_trust_prior:
                dom = (source.get("domain") or "").lower()
                trust = min(0.95, domain_reliability(dom) * 0.6 + consensus_score * 0.4)
            
            # Composite score (passage grounded)
            if self.use_trust_prior:
                composite_score = (
                    relevance_score * 0.40 +
                    passage_score  * 0.25 +
                    quality_score  * 0.20 +
                    trust          * 0.15
                )
            else:
                composite_score = (
                    relevance_score * 0.45 +
                    passage_score  * 0.25 +
                    quality_score  * 0.20 +
                    consensus_score* 0.10
                )
            
            scored_sources.append((source, composite_score))
            
            # Debug top scoring sources
            if composite_score > 0.7:
                domain = source.get('domain', 'unknown')
                title = source.get('title', 'No title')[:50]
                print(f"[DEBUG] High score {composite_score:.2f}: {domain} - {title}")
        
        print(f"[DEBUG] Scored {len(scored_sources)} sources, selecting {target_count}")
        
        # Apply diversity constraints
        selected = self.enforce_realistic_diversity(scored_sources, target_count)
        
        print(f"[DEBUG] Selected {len(selected)} diverse sources")
        for source in selected[:5]:  # Show first 5
            domain = source.get('domain', 'unknown')
            domain_type = self.get_domain_type(domain)
            print(f"[DEBUG] Selected: {domain} ({domain_type})")
        
        return selected


# Global instance
TRUE_CITATION_SELECTOR = TrueCitationSelector()