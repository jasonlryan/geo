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
    
    # Research institutes and think tanks
    research_patterns = ["research", "institute", "arxiv", "scholar", "researchgate", "pubmed", "ncbi", 
                        "brookings", "rand.org", "heritage", "aei.org", "cfr.org", "carnegie", 
                        "urban.org", "pewresearch", "gallup", "mckinsey institute"]
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