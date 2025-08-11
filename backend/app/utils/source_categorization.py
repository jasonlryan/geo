"""
Source categorization utility for classifying sources by type.
"""

def categorize_source(domain: str, media_type: str = "") -> str:
    """
    Categorize a source based on domain and media type.
    
    Specific categories for business intelligence:
    - gov: Government agencies and departments
    - edu: Universities and educational institutions  
    - research: Research institutes and think tanks
    - consultancy: Management consulting firms
    - agency: Recruitment and executive search agencies
    - news: News organizations and journalism
    - financial: Financial services and reports
    - legal: Legal and regulatory sources
    - nonprofit: Nonprofit organizations and foundations
    - corporate: General corporate websites
    - social: Social media platforms
    - blog: Personal/corporate blogs
    """
    if not domain:
        return "corporate"
        
    domain = domain.lower()
    media_type = media_type.lower()
    tld = domain.split(".").pop() or ""
    
    # Government sites (federal, state, local)
    gov_patterns = [".gov", ".state.", ".city.", ".county.", "gov.", "municipal", "government"]
    if (domain.endswith(".gov") or tld == "gov" or 
        any(pattern in domain for pattern in gov_patterns)):
        return "gov"
    
    # Educational institutions
    edu_patterns = [".edu", "university", "college", "school", ".ac."]
    if (domain.endswith(".edu") or 
        any(pattern in domain for pattern in edu_patterns)):
        return "edu"
    
    # Research institutes and think tanks + Academic publishers
    research_patterns = ["research", "institute", "arxiv", "scholar", "researchgate", "pubmed", "ncbi", 
                        "brookings", "rand.org", "heritage", "aei.org", "cfr.org", "carnegie", 
                        "urban.org", "pewresearch", "gallup", "mckinsey institute",
                        # Academic publishers and journals
                        "springer", "nature.com", "ieee.org", "acm.org", "sciencedirect", 
                        "sagepub", "tandfonline", "jstor", "wiley", "elsevier", "pnas.org",
                        "science.org", "cell.com", "nejm.org", "bmj.com", "thelancet.com"]
    if (any(pattern in domain for pattern in research_patterns) or
        (media_type and ("paper" in media_type or "journal" in media_type or "research" in media_type))):
        return "research"
    
    # Management consulting firms
    consultancy_patterns = ["mckinsey", "bcg.com", "bain.com", "deloitte", "pwc.com", "kpmg", "accenture", 
                           "ey.com", "booz", "oliverwyman", "strategy&", "leku.com", "rolandberger", 
                           "atkearney", "monitor", "parthenon"]
    if any(pattern in domain for pattern in consultancy_patterns):
        return "consultancy"
    
    # Executive search and recruitment agencies  
    agency_patterns = ["search", "executive", "recruitment", "talent", "headhunt", "heidrick", "russell", 
                      "egon", "korn", "spencer", "odgers", "amrop", "boyden", "hunter", "recruit",
                      "hr", "staffing"]
    # Special case for consulting firms that do search/talent/executive work
    if (any(pattern in domain for pattern in agency_patterns) or
        ("consulting" in domain and any(keyword in domain for keyword in ["search", "talent", "executive"]))):
        return "agency"
    
    # News organizations
    news_patterns = ["reuters", "bloomberg", "wsj", "nytimes", "cnn", "bbc", "guardian", "washingtonpost",
                    "ft.com", "economist", "npr.org", "pbs.org", "abc.com", "cbsnews", "nbcnews", 
                    "times", "post", "herald", "tribune", "journal", "news", "press"]
    if (any(pattern in domain for pattern in news_patterns) or
        (media_type and "news" in media_type)):
        return "news"
    
    # Financial services and reports
    financial_patterns = ["bank", "financial", "finance", "investment", "trading", "market", 
                         "fund", "capital", "securities", "investor", "analyst", "rating"]
    if any(pattern in domain for pattern in financial_patterns):
        return "financial"
    
    # Legal and regulatory
    legal_patterns = ["sec.gov", "ftc.gov", "justice.gov", "supremecourt", "law", "legal", 
                     "regulation", "compliance", "court", "attorney", "lawyer"]
    if any(pattern in domain for pattern in legal_patterns):
        return "legal"
    
    # Nonprofit organizations and foundations
    nonprofit_patterns = ["foundation", "charity", "nonprofit", "ngo", ".org"]
    if (tld == "org" or any(pattern in domain for pattern in nonprofit_patterns)):
        # Exclude government .org domains
        if not any(gov in domain for gov in ["gov", "state", "city"]):
            return "nonprofit"
    
    # International agencies
    intl_agency_patterns = [".who.int", ".europa.eu", ".un.org", ".oecd.org", ".worldbank.org", 
                           ".imf.org", ".wto.org", ".nato.int", "redcross", "amnesty", "hrw.org"]
    if any(pattern in domain for pattern in intl_agency_patterns):
        return "gov"  # Treat as government for simplicity
    
    # Social media platforms
    social_domains = ["twitter", "x.com", "reddit", "tiktok", "youtube", "linkedin", "facebook", 
                     "instagram", "threads", "mastodon"]
    if any(social in domain for social in social_domains):
        return "social"
    
    # Blog content
    blog_patterns = ["blog", "medium.com", "substack", "wordpress", "blogger"]
    if (any(pattern in domain for pattern in blog_patterns) or
        (media_type and "blog" in media_type)):
        return "blog"
    
    # Default to corporate
    return "corporate"


def classify_authority(credibility_score: float) -> str:
    """Classify source authority level for intelligence analysis."""
    if credibility_score >= 0.8:
        return "high"
    elif credibility_score >= 0.6:
        return "medium"
    else:
        return "low"


def classify_recency(published_at: str | None) -> str:
    """Classify content recency for intelligence analysis."""
    if not published_at:
        return "unknown"
    
    from datetime import datetime, timedelta
    try:
        # Handle ISO format with or without Z suffix
        if published_at.endswith('Z'):
            pub_date = datetime.fromisoformat(published_at[:-1] + '+00:00')
        else:
            pub_date = datetime.fromisoformat(published_at)
            
        now = datetime.now(pub_date.tzinfo) if pub_date.tzinfo else datetime.now()
        age = now - pub_date
        
        if age <= timedelta(days=30):
            return "recent"
        elif age <= timedelta(days=180):
            return "medium"
        else:
            return "stale"
    except (ValueError, TypeError):
        return "unknown"


def calculate_credibility_score(domain: str, category: str, published_at: str | None = None, 
                               content_length: int = 0, author: str = "", title: str = "") -> dict:
    """
    Calculate a comprehensive credibility score based on multiple factors.
    Returns a dict with score (0-1) and explanatory factors.
    """
    factors = []
    score = 0.0
    
    # NEUTRALIZED: Equal base scores - let content quality determine authority
    domain_scores = {
        "gov": 0.60,      # Neutral base score
        "edu": 0.60,      # Neutral base score
        "research": 0.60, # Neutral base score
        "news": 0.60,     # Neutral base score
        "consultancy": 0.60,  # Neutral base score
        "financial": 0.60,    # Neutral base score
        "legal": 0.60,    # Neutral base score
        "nonprofit": 0.60,    # Neutral base score
        "agency": 0.60,   # Neutral base score
        "corporate": 0.60,    # Neutral base score
        "social": 0.60,   # Neutral base score
        "blog": 0.60,     # Neutral base score
    }
    
    base_score = domain_scores.get(category, 0.40)
    score = base_score
    factors.append(f"Domain authority ({category}): {base_score:.2f}")
    
    # DISABLED: No hardcoded domain authority - let content quality decide
    # high_authority_domains = {...}  # COMPLETELY REMOVED
    
    # No domain-specific score adjustments
    
    # Recency factor (more important for time-sensitive topics)
    if published_at:
        recency_class = classify_recency(published_at)
        recency_adjustments = {
            "recent": 0.05,   # Recent content gets small boost
            "medium": 0.0,    # No adjustment
            "stale": -0.10,   # Old content penalized
            "unknown": -0.02  # Unknown dates slightly penalized
        }
        
        recency_adj = recency_adjustments.get(recency_class, 0)
        score += recency_adj
        factors.append(f"Content recency ({recency_class}): {recency_adj:+.2f}")
    
    # Content quality indicators
    if content_length > 0:
        # Length factor - substantial articles are more credible
        if content_length >= 2000:
            length_bonus = 0.05
            factors.append(f"Substantial content (+2000 chars): +{length_bonus:.2f}")
        elif content_length >= 1000:
            length_bonus = 0.02
            factors.append(f"Adequate content (+1000 chars): +{length_bonus:.2f}")
        elif content_length < 300:
            length_bonus = -0.05
            factors.append(f"Thin content (<300 chars): {length_bonus:.2f}")
        else:
            length_bonus = 0
        
        score += length_bonus
    
    # Author credibility (if available)
    if author and author.strip():
        # Simple heuristic: named authors more credible than anonymous
        author_bonus = 0.03
        score += author_bonus
        factors.append(f"Named author: +{author_bonus:.2f}")
    
    # Title quality indicators
    if title:
        title_lower = title.lower()
        # Penalize clickbait patterns
        clickbait_patterns = ["you won't believe", "shocking", "this one trick", 
                            "doctors hate", "must see", "amazing", "incredible"]
        if any(pattern in title_lower for pattern in clickbait_patterns):
            clickbait_penalty = -0.08
            score += clickbait_penalty
            factors.append(f"Clickbait title: {clickbait_penalty:.2f}")
        
        # Boost academic/professional title patterns  
        if any(pattern in title_lower for pattern in ["study", "analysis", "report", "research", "findings"]):
            academic_bonus = 0.03
            score += academic_bonus
            factors.append(f"Academic title: +{academic_bonus:.2f}")
    
    # Ensure score stays in bounds [0, 1]
    score = max(0.0, min(1.0, score))
    
    # Calculate letter grade
    if score >= 0.8:
        grade = "A"
    elif score >= 0.65:
        grade = "B" 
    elif score >= 0.5:
        grade = "C"
    elif score >= 0.35:
        grade = "D"
    else:
        grade = "F"
    
    return {
        "score": round(score, 3),
        "band": grade,
        "factors": factors,
        "category": category,
        "methodology": "domain_authority + recency + content_quality + author_signals"
    }