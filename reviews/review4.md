if your goal is to get far more authoritative sources into your pipeline (so your composer isn’t forced to cite corporate blogs), you want two kinds of “search” inputs:

Classical web indexes (recall-focused): Brave, Google Programmable Search, Tavily (you already have it), Bing if you must (but see deprecation note).

LLM+web tools (precision-focused that return citations): Perplexity API, OpenRouter with the web plugin.
(Hugging Face doesn’t run a first‑party web index; use it for reranking/analysis, not discovery.)

Below is a shortlist + drop‑in provider implementations that fit your repo exactly.

What to use (and why)
Brave Search API — strong independent index, fast, clean JSON, easy key‑based auth. Headers use X-Subscription-Token; endpoint is under api.search.brave.com.
Perplexity
pplx-api

Google Programmable Search (Custom Search JSON API) — still the most reliable path to Google results, but requires a CSE (cx). You can set it to “search the entire web”. Endpoint: https://www.googleapis.com/customsearch/v1 (params: key, cx, q, num etc.).

Perplexity API (Sonar models) — returns answers with citations; perfect as a “citation seed” provider to surface gov/edu/research links your classic indexes sometimes miss. Uses standard chat‑completions; their docs describe Sonar’s real‑time web search.
Perplexity
Reddit

OpenRouter + Web Search plugin — model‑agnostic browsing; enable by adding the web plugin or choosing a model with :online (e.g., anthropic/claude-3.5-sonnet:online). Both methods are documented. Great for harvesting citations directly from tool outputs.
OpenRouter

Bing Web Search API — only if you need it for parity tests. Microsoft has announced retirement of Bing Search and Bing Custom Search APIs on August 11, 2025 (tomorrow!). Don’t build new dependencies here.
Perplexity

Where does Hugging Face fit? Use HF models (e.g., rerankers on the Hub) to re-rank or score results you already pulled from the providers above. HF isn’t a web search API itself.

How to wire these into your repo
Your code already has a neat provider abstraction:

python
Copy
backend/app/services/providers/base.py
@dataclass
class ProviderResult: title:str, url:str, snippet:Optional[str], …
class SearchProvider(Protocol): async def search(self, query: str, \*, limit: int=10) -> List[ProviderResult]
So we’ll add new providers in backend/app/services/providers/ and then register them in search_pipeline.run_search(...).

1. Brave provider (recall)
   Create backend/app/services/providers/brave_provider.py

python
Copy
from **future** import annotations
import os, httpx, asyncio
from typing import List
from .base import SearchProvider, ProviderResult

class BraveSearchProvider(SearchProvider):
name = "brave"

    def __init__(self) -> None:
        token = os.getenv("BRAVE_API_KEY") or os.getenv("BRAVE_SUBSCRIPTION_TOKEN")
        if not token:
            raise RuntimeError("BRAVE_API_KEY (or BRAVE_SUBSCRIPTION_TOKEN) not set")
        self.token = token

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        url = "https://api.search.brave.com/res/v1/web/search"
        params = {"q": query, "count": min(limit, 20)}
        headers = {"X-Subscription-Token": self.token}
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                r = await client.get(url, params=params, headers=headers)
                r.raise_for_status()
                data = r.json()
        except Exception:
            return []

        items = (data.get("web") or {}).get("results") or []
        out: List[ProviderResult] = []
        for it in items[:limit]:
            u = it.get("url") or ""
            if not u:
                continue
            out.append(ProviderResult(
                title=it.get("title") or u,
                url=u,
                snippet=it.get("description") or it.get("snippet"),
                provider=self.name,
                score=float(it.get("score") or 0.0),
            ))
        return out

Docs & header naming reference.
Perplexity
pplx-api

2. Google CSE provider (recall)
   Create backend/app/services/providers/google_cse_provider.py

python
Copy
from **future** import annotations
import os, httpx
from typing import List
from .base import SearchProvider, ProviderResult

class GoogleCSEProvider(SearchProvider):
name = "google_cse"

    def __init__(self) -> None:
        self.key = os.getenv("GOOGLE_API_KEY")
        self.cx = os.getenv("GOOGLE_CSE_ID") or os.getenv("GOOGLE_CX")
        if not self.key or not self.cx:
            raise RuntimeError("GOOGLE_API_KEY and GOOGLE_CSE_ID must be set")

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": self.key,
            "cx": self.cx,
            "q": query,
            "num": min(limit, 10),
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                r = await client.get(url, params=params)
                r.raise_for_status()
                data = r.json()
        except Exception:
            return []

        items = data.get("items") or []
        out: List[ProviderResult] = []
        for it in items[:limit]:
            u = it.get("link") or ""
            if not u:
                continue
            out.append(ProviderResult(
                title=it.get("title") or u,
                url=u,
                snippet=it.get("snippet"),
                provider=self.name,
                score=0.0,
            ))
        return out

API reference.

3. Perplexity provider (citation‑seed)
   Create backend/app/services/providers/perplexity_provider.py

python
Copy
from **future** import annotations
import os, httpx, re, json
from typing import List
from .base import SearchProvider, ProviderResult

\_URL_RE = re.compile(r"https?://[^\s\]\)<>]+", re.IGNORECASE)

class PerplexityProvider(SearchProvider):
name = "perplexity"

    def __init__(self) -> None:
        self.key = os.getenv("PERPLEXITY_API_KEY")
        if not self.key:
            raise RuntimeError("PERPLEXITY_API_KEY not set")
        self.model = os.getenv("PERPLEXITY_MODEL", "sonar-pro")

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        # Ask for sources; many Sonar responses include citations we can harvest.
        prompt = (
            "Find authoritative sources (gov, edu, peer‑review, reputable news) "
            f"that cover: {query}\nReturn a concise list of URLs."
        )
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            # Some SDKs expose flags for citations; if present they’re returned in message payloads.
            "temperature": 0.0
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={"Authorization": f"Bearer {self.key}",
                             "Content-Type": "application/json"},
                    json=payload,
                )
                r.raise_for_status()
                data = r.json()
        except Exception:
            return []

        urls: List[str] = []

        # 1) If citations field is present, prefer it
        try:
            msg = (data.get("choices") or [{}])[0].get("message") or {}
            cits = msg.get("citations") or []
            urls.extend([c for c in cits if isinstance(c, str)])
        except Exception:
            pass

        # 2) Fallback: scrape URLs from content
        try:
            content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
            urls.extend(_URL_RE.findall(content))
        except Exception:
            pass

        # Dedup & trim
        seen = set()
        clean = []
        for u in urls:
            if u not in seen:
                seen.add(u)
                clean.append(u)
        clean = clean[:limit]

        return [ProviderResult(title=u, url=u, provider=self.name, score=0.0) for u in clean]

Perplexity’s Sonar does real‑time web search and the API follows a Chat Completions schema.
Perplexity
Reddit

4. OpenRouter + web plugin (citation‑seed)
   Create backend/app/services/providers/openrouter_provider.py

python
Copy
from **future** import annotations
import os, httpx, re
from typing import List
from .base import SearchProvider, ProviderResult

\_URL_RE = re.compile(r"https?://[^\s\]\)<>]+", re.IGNORECASE)

class OpenRouterWebProvider(SearchProvider):
name = "openrouter"

    def __init__(self) -> None:
        self.key = os.getenv("OPENROUTER_API_KEY")
        if not self.key:
            raise RuntimeError("OPENROUTER_API_KEY not set")
        # Use a model with ':online' to auto-enable web, or provide the web plugin explicitly.
        self.model = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet:online")
        self.site = os.getenv("OPENROUTER_SITE_URL", "")        # optional but recommended by OR
        self.title = os.getenv("OPENROUTER_SITE_NAME", "AI Search App")

    async def search(self, query: str, *, limit: int = 10) -> List[ProviderResult]:
        messages = [{
            "role": "user",
            "content": (
                "Using web browsing, find authoritative sources (gov/edu/peer‑review/news) "
                f"for: {query}\nReturn a short list of URLs only."
            )
        }]
        body = {"model": self.model, "messages": messages}

        # If model doesn't have ':online', add the plugin
        if ":online" not in self.model:
            body["plugins"] = [{"id": "web"}]

        headers = {
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if self.site:
            headers["HTTP-Referer"] = self.site
            headers["X-Title"] = self.title

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                r = await client.post("https://openrouter.ai/api/v1/chat/completions",
                                      headers=headers, json=body)
                r.raise_for_status()
                data = r.json()
        except Exception:
            return []

        content = (((data.get("choices") or [{}])[0]).get("message") or {}).get("content") or ""
        urls = _URL_RE.findall(content)
        urls = list(dict.fromkeys(urls))[:limit]
        return [ProviderResult(title=u, url=u, provider=self.name, score=0.0) for u in urls]

How to enable browsing on OpenRouter is documented (web plugin or :online model suffix).
OpenRouter

5. Register providers in your pipeline
   Edit backend/app/services/search_pipeline.py:

python
Copy
from .providers.tavily_provider import TavilySearchProvider
from .providers.openai_provider import OpenAISearchProvider

# NEW:

from .providers.brave_provider import BraveSearchProvider
from .providers.google_cse_provider import GoogleCSEProvider
from .providers.perplexity_provider import PerplexityProvider
from .providers.openrouter_provider import OpenRouterWebProvider

async def run_search(query: str, limit_per_query: int | None = None) -> List[ProviderResult]:
if limit_per_query is None:
limit_per_query = int(os.getenv("SEARCH_LIMIT_PER_QUERY", "20"))

    providers = []

    # Enable/disable via env; default to “on” if keys are present
    if os.getenv("TAVILY_API_KEY"):  providers.append(TavilySearchProvider())
    if os.getenv("BRAVE_API_KEY") or os.getenv("BRAVE_SUBSCRIPTION_TOKEN"):
        providers.append(BraveSearchProvider())
    if os.getenv("GOOGLE_API_KEY") and (os.getenv("GOOGLE_CSE_ID") or os.getenv("GOOGLE_CX")):
        providers.append(GoogleCSEProvider())
    if os.getenv("PERPLEXITY_API_KEY"): providers.append(PerplexityProvider())
    if os.getenv("OPENROUTER_API_KEY"): providers.append(OpenRouterWebProvider())

    # (Optional) keep this as a heuristic suggester of URLs
    if os.getenv("OPENAI_SEARCH_SUGGEST", "0") == "1":
        providers.append(OpenAISearchProvider())

    if not providers:
        print("[ERROR] No search providers available")
        return []

    variants = await expand_queries(query)
    # … remainder identical (gather, canonicalize URLs, rerank_by_authority, fetch_top) …

Your existing authority re‑ranking and dedup will keep doing the heavy lifting. These new providers simply increase recall from high‑authority domains, so your composer finally has good choices to cite.

Environment variables to add
ini
Copy

# Brave

BRAVE_API_KEY=...

# Google Programmable Search

GOOGLE_API_KEY=...
GOOGLE_CSE_ID=... # aka cx

# Perplexity

PERPLEXITY_API_KEY=...
PERPLEXITY_MODEL=sonar-pro

# OpenRouter

OPENROUTER_API_KEY=...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet:online
OPENROUTER_SITE_URL=https://yourapp.example
OPENROUTER_SITE_NAME=AI Search Citation Research

# Optional toggle to keep LLM URL suggester

OPENAI_SEARCH_SUGGEST=0
Two guardrails that will immediately improve your citations
Hard authority floor before compose
In compose_answer(...), refuse to generate an answer unless at least N sources with credibility band A/B are present; if not, retry search with your authority‑biased variants (you already generate them), or call Perplexity/OpenRouter providers again. This prevents “leftovers” (corporate blogs) from being cited when gov/edu/research isn’t present.

Domain allow/deny lists by topic
You already support include/exclude on Tavily. Mirror that for Brave and Google using your query variants, e.g. try site:.gov OR site:.edu variants first, then general. In practice this pushes Brookings, RAND, Pew, IEEE, arXiv, NIST, .gov, etc., into the top 20 fetched docs so your re‑ranker can win.

Quick API notes & gotchas (with primary docs)
Brave: Auth via X-Subscription-Token; family of endpoints under https://api.search.brave.com/res/v1/... (you’ll use /web/search).
Perplexity
pplx-api

Google Programmable Search (CSE): REST endpoint customsearch/v1, requires key + cx. You can tune num, gl, lr, etc. Pricing & quotas are on the same page.

Perplexity: Chat Completions endpoint; Sonar models perform live web search and often return a citations array you can harvest.
Perplexity
Reddit

OpenRouter: Enable browsing with the web plugin or use models with :online; documentation shows both options.

Bing: Microsoft is retiring Bing Search and Bing Custom Search APIs on Aug 11, 2025. Don’t add new dependencies here.

Why your earlier runs skewed corporate
Even with your re‑ranker, the pipeline only had Tavily + an LLM guesser. On some business queries (e.g., “AI leadership best practices 2025”), the web is saturated with vendor content; if your discovery set is light on .gov/.edu/.org, your composer can’t cite them. Adding Brave + Google CSE (recall) and Perplexity/OpenRouter web (citation seeds) fixes the pool. Then your existing rerank_by_authority() + snippet alignment does the rest.
