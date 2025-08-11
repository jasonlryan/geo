"""
Realistic citation selector based on 2025 AI search engine research.
Mirrors how ChatGPT, Perplexity, and Google AI Overviews actually select sources.
"""

import re
from typing import List, Dict, Any, Set, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import math


class RealisticCitationSelector:
    def __init__(self):
        # Research-based source type preferences
        self.diversity_requirements = {
            "authoritative": 0.3,    # Gov, research, established orgs
            "commercial": 0.3,       # Corporate sites, company content  
            "community": 0.2,        # Reddit-style, forums, Q&A
            "news_media": 0.15,      # News orgs, publishers
            "specialized": 0.05      # Niche/technical sources
        }
        
        # Query-context authority weights (not just domain TLD)
        self.context_authority_patterns = {
            "technical": {
                "patterns": ["api", "developer", "code", "programming", "technical", "documentation", "github"],
                "source_preferences": ["corporate", "community", "specialized"]
            },
            "business": {
                "patterns": ["market", "business", "strategy", "industry", "finance", "revenue"],
                "source_preferences": ["authoritative", "commercial", "news_media"]
            },
            "consumer": {
                "patterns": ["review", "product", "buy", "best", "comparison", "opinion"],
                "source_preferences": ["community", "commercial", "specialized"]
            },
            "academic": {
                "patterns": ["research", "study", "analysis", "findings", "methodology"],
                "source_preferences": ["authoritative", "specialized", "news_media"]
            },
            "current_events": {
                "patterns": ["news", "latest", "recent", "breaking", "update", "2024", "2025"],
                "source_preferences": ["news_media", "community", "authoritative"]
            }
        }
        
        # High-trust domains by category (research-based)
        self.trusted_domains = {
            "authoritative": {
                # Government & International
                "sec.gov": 0.95, "fed.gov": 0.94, "treasury.gov": 0.93, "cdc.gov": 0.92,
                "who.int": 0.91, "europa.eu": 0.90, "oecd.org": 0.89,
                # Top Academic Publishers
                "nature.com": 0.94, "science.org": 0.93, "cell.com": 0.92, "pnas.org": 0.91,
                # Premier Research Institutions  
                "brookings.edu": 0.90, "rand.org": 0.89, "cfr.org": 0.88, "pewresearch.org": 0.87,
                # Elite Universities (selective)
                "harvard.edu": 0.88, "stanford.edu": 0.87, "mit.edu": 0.87
            },
            "news_media": {
                # Tier 1 News
                "reuters.com": 0.87, "bloomberg.com": 0.86, "wsj.com": 0.85, "ft.com": 0.84,
                "economist.com": 0.83, "nytimes.com": 0.82, "washingtonpost.com": 0.81,
                # Tier 2 News  
                "cnn.com": 0.78, "bbc.com": 0.79, "npr.org": 0.78, "pbs.org": 0.77
            },
            "commercial": {
                # Top Tech Companies (for their domains)
                "microsoft.com": 0.82, "google.com": 0.81, "apple.com": 0.80, "amazon.com": 0.79,
                # Management Consulting
                "mckinsey.com": 0.84, "bcg.com": 0.82, "bain.com": 0.81, "deloitte.com": 0.79,
                "pwc.com": 0.78, "kpmg.com": 0.77
            },
            "community": {
                # Research shows these are heavily cited by AI
                "reddit.com": 0.75, "stackoverflow.com": 0.78, "quora.com": 0.72,
                "github.com": 0.79, "medium.com": 0.70
            },
            "specialized": {
                # Technical/Industry specific
                "ieee.org": 0.85, "acm.org": 0.84, "arxiv.org": 0.82,
                # Review platforms (Perplexity favorites)
                "g2.com": 0.76, "yelp.com": 0.74, "tripadvisor.com": 0.73
            }
        }

    def classify_source_type(self, domain: str, title: str = "", content: str = "") -> str:
        """Classify source into realistic categories based on AI search research."""
        domain = domain.lower()
        title_lower = title.lower()
        
        # Government and international organizations
        if (domain.endswith('.gov') or domain.endswith('.int') or 
            'europa.eu' in domain or any(gov in domain for gov in ['who.', 'oecd.', 'worldbank.'])):
            return "authoritative"
        
        # Academic publishers and premier research
        academic_publishers = ['nature.com', 'science.org', 'cell.com', 'pnas.org', 'arxiv.org']
        research_orgs = ['brookings.', 'rand.org', 'cfr.org', 'pewresearch.', 'urban.org']
        if (any(pub in domain for pub in academic_publishers) or
            any(org in domain for org in research_orgs)):
            return "authoritative"
        
        # Elite universities only (not all .edu)
        elite_unis = ['harvard.edu', 'stanford.edu', 'mit.edu', 'princeton.edu', 'yale.edu',
                     'columbia.edu', 'uchicago.edu', 'upenn.edu', 'caltech.edu', 'northwestern.edu']
        if any(uni in domain for uni in elite_unis):
            return "authoritative"
        
        # News organizations
        news_domains = ['reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'economist.com',
                       'nytimes.com', 'washingtonpost.com', 'cnn.com', 'bbc.com', 'npr.org',
                       'pbs.org', 'axios.com', 'politico.com']
        if any(news in domain for news in news_domains) or 'news' in domain:
            return "news_media"
        
        # Community platforms (AI search favorites)
        community_domains = ['reddit.com', 'stackoverflow.com', 'quora.com', 'github.com', 
                            'medium.com', 'substack.com', 'hackernews.com']
        if any(comm in domain for comm in community_domains):
            return "community"
        
        # Specialized/Technical
        tech_domains = ['ieee.org', 'acm.org', 'arxiv.org', 'github.io']
        review_domains = ['g2.com', 'yelp.com', 'tripadvisor.com', 'trustpilot.com']
        if (any(tech in domain for tech in tech_domains) or 
            any(review in domain for review in review_domains)):
            return "specialized"
        
        # Default to commercial for .com, .io, etc.
        return "commercial"

    def calculate_query_relevance_score(self, query: str, source: Dict[str, Any]) -> float:
        """Calculate how relevant source content is to the specific query."""
        query_lower = query.lower()
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        
        # Get source content
        title = source.get('title', '').lower()
        content = source.get('raw_text', '')[:1000].lower()  # First 1000 chars
        url = source.get('url', '').lower()
        
        # Title relevance (highest weight - mirrors AI behavior)
        title_words = set(re.findall(r'\b\w+\b', title))
        title_overlap = len(query_words & title_words) / max(len(query_words), 1)
        title_score = title_overlap * 0.5
        
        # Content relevance
        content_words = set(re.findall(r'\b\w+\b', content))
        content_overlap = len(query_words & content_words) / max(len(query_words), 1)
        content_score = content_overlap * 0.3
        
        # URL semantic relevance
        url_words = set(re.findall(r'\b\w+\b', url.replace('-', ' ').replace('_', ' ')))
        url_overlap = len(query_words & url_words) / max(len(query_words), 1)
        url_score = url_overlap * 0.2
        
        return min(1.0, title_score + content_score + url_score)

    def get_contextual_authority_score(self, query: str, domain: str, source_type: str) -> float:
        """Get authority score based on query context, not just domain TLD."""
        query_lower = query.lower()
        
        # Determine query context
        query_context = "general"
        for context, info in self.context_authority_patterns.items():
            if any(pattern in query_lower for pattern in info["patterns"]):
                query_context = context
                break
        
        # Base domain authority
        base_score = 0.5  # Neutral starting point
        
        # Check if domain is in trusted lists
        for category, domains in self.trusted_domains.items():
            if domain.lower() in domains:
                base_score = domains[domain.lower()]
                break
        
        # Apply context-specific boosts
        context_info = self.context_authority_patterns.get(query_context, {})
        preferred_types = context_info.get("source_preferences", [])
        
        if source_type in preferred_types:
            boost = 0.1 * (len(preferred_types) - preferred_types.index(source_type))
            base_score += boost
        
        return min(1.0, base_score)

    def calculate_freshness_score(self, published_at: str, query: str) -> float:
        """Calculate freshness score - higher weight for time-sensitive queries."""
        if not published_at:
            return 0.5  # Neutral for unknown dates
        
        try:
            # Parse publication date
            if published_at.endswith('Z'):
                pub_date = datetime.fromisoformat(published_at[:-1] + '+00:00')
            else:
                pub_date = datetime.fromisoformat(published_at)
            
            now = datetime.now(pub_date.tzinfo) if pub_date.tzinfo else datetime.now()
            age_days = (now - pub_date).days
            
            # Time-sensitive query detection
            time_sensitive = any(term in query.lower() for term in 
                               ['latest', 'recent', '2024', '2025', 'current', 'now', 'today', 'new'])
            
            if time_sensitive:
                # Heavy freshness weighting for time-sensitive queries
                if age_days <= 30:
                    return 1.0
                elif age_days <= 90:
                    return 0.8
                elif age_days <= 365:
                    return 0.6
                else:
                    return 0.3
            else:
                # Moderate freshness preference for general queries
                if age_days <= 180:
                    return 0.8
                elif age_days <= 730:  # 2 years
                    return 0.6
                else:
                    return 0.5
        
        except (ValueError, TypeError):
            return 0.5

    def calculate_content_quality_score(self, source: Dict[str, Any]) -> float:
        """Calculate content quality based on AI-preferred signals."""
        score = 0.5  # Base score
        
        title = source.get('title', '')
        content = source.get('raw_text', '')
        url = source.get('url', '')
        
        # Content depth (AI prefers substantial content)
        content_length = len(content)
        if content_length >= 2000:
            score += 0.2
        elif content_length >= 1000:
            score += 0.1
        elif content_length < 200:
            score -= 0.1
        
        # Structured content signals (AI loves lists, comparisons)
        if any(pattern in title.lower() for pattern in ['how to', 'guide', 'tutorial', 'comparison', 'vs', 'best']):
            score += 0.15
        
        if any(pattern in content.lower() for pattern in ['1.', '2.', '•', 'step', 'method']):
            score += 0.1
        
        # URL structure (semantic clarity)
        if re.match(r'^https?://[^/]+/[^/]*[a-z-]+[^/]*/?$', url):  # Clean, descriptive URLs
            score += 0.05
        
        # Avoid clickbait (AI search engines penalize this)
        clickbait_patterns = ['shocking', 'unbelievable', 'you won\'t believe', 'this one trick']
        if any(pattern in title.lower() for pattern in clickbait_patterns):
            score -= 0.15
        
        return min(1.0, max(0.0, score))

    def enforce_diversity(self, scored_sources: List[Tuple[Dict[str, Any], float]], 
                         target_count: int = 10) -> List[Dict[str, Any]]:
        """Enforce source type diversity like real AI search engines."""
        
        # Group sources by type
        by_type = defaultdict(list)
        for source, score in scored_sources:
            source_type = self.classify_source_type(source.get('domain', ''), 
                                                   source.get('title', ''),
                                                   source.get('raw_text', ''))
            by_type[source_type].append((source, score))
        
        # Sort each type by score
        for source_type in by_type:
            by_type[source_type].sort(key=lambda x: x[1], reverse=True)
        
        # Apply diversity requirements
        selected = []
        remaining_slots = target_count
        
        for source_type, target_ratio in self.diversity_requirements.items():
            if source_type not in by_type:
                continue
            
            target_count_for_type = max(1, int(target_ratio * target_count))
            actual_count = min(target_count_for_type, len(by_type[source_type]), remaining_slots)
            
            # Take top sources of this type
            for source, score in by_type[source_type][:actual_count]:
                selected.append(source)
                remaining_slots -= 1
                
            if remaining_slots <= 0:
                break
        
        # Fill remaining slots with highest scoring sources
        if remaining_slots > 0:
            used_source_ids = {s.get('source_id') for s in selected}
            remaining_sources = [
                (source, score) for source, score in scored_sources 
                if source.get('source_id') not in used_source_ids
            ]
            remaining_sources.sort(key=lambda x: x[1], reverse=True)
            
            for source, score in remaining_sources[:remaining_slots]:
                selected.append(source)
        
        return selected[:target_count]

    def select_citations(self, query: str, sources: List[Dict[str, Any]], 
                        target_count: int = 10) -> List[Dict[str, Any]]:
        """
        Select citations using realistic AI search methodology.
        
        Based on 2025 research: query relevance + contextual authority + diversity
        """
        if not sources:
            return []
        
        scored_sources = []
        
        for source in sources:
            domain = source.get('domain', '')
            source_type = self.classify_source_type(domain, source.get('title', ''), 
                                                   source.get('raw_text', ''))
            
            # Multi-factor scoring (mirrors real AI search)
            relevance_score = self.calculate_query_relevance_score(query, source)
            authority_score = self.get_contextual_authority_score(query, domain, source_type)
            freshness_score = self.calculate_freshness_score(source.get('published_at'), query)
            quality_score = self.calculate_content_quality_score(source)
            
            # Weighted composite score (relevance is primary)
            composite_score = (
                relevance_score * 0.45 +      # Query relevance is primary
                authority_score * 0.25 +      # Contextual authority
                freshness_score * 0.15 +      # Freshness based on query type
                quality_score * 0.15          # Content quality signals
            )
            
            scored_sources.append((source, composite_score))
        
        # Sort by composite score
        scored_sources.sort(key=lambda x: x[1], reverse=True)
        
        # Apply diversity enforcement
        return self.enforce_diversity(scored_sources, target_count)


# Global instance
CITATION_SELECTOR = RealisticCitationSelector()