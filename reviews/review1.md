here’s the quick read, then I’ll go deeper:

What it is: a full‑stack demo of an “AI search with citations” pipeline (FastAPI + Next.js) that runs a web search, fetches pages, asks an LLM to write a short answer with sentence‑level citations, and stores the whole run so you can analyze what got found vs what got cited.

Purpose: to reverse‑engineer/measure “citation‑worthiness” for marketing/SEO intelligence (which domains/genres the AI actually cites), and to generate compact run reports you can reuse.

Effectiveness today: solid skeleton and a good UI for demos; research rigor is limited by placeholder parsing, simplistic credibility signals, single provider search, and a few bugs/missing files.

How to improve: fix a couple of blockers (TTL “permanent” storage, missing prompts/components), upgrade parsing & evidence, diversify search, and add real authority/recency scoring. I list concrete fixes + a short roadmap below.

What this codebase is
A two‑part app:

Backend (FastAPI, backend/app)

Search pipeline: expands a query a little (latest …, … 2025), calls Tavily for results (services/providers/tavily_provider.py), fetches pages (services/fetch_parse.py), then asks OpenAI to compose a 3–6 sentence answer with explicit source_id citations (services/composer.py).

Run bundle storage: each execution is stored as a single JSON “bundle” in a cache (Redis if configured, memory fallback) with run metadata, sources, claims, evidence, answer, and raw provider results (core/store.py).

Analysis: computes a Proposed → Fetched → Cited funnel and simple mix stats (top domains, media types, credibility bands), then (optionally) runs an LLM-based “citation analysis” over the bundle to produce risks/recs (services/analysis.py, services/analysis_llm.py).

Insights endpoints: recent runs, aggregates (avg citation rate, top cited domains), “intelligence reports” index, etc. (routers/runs.py).

API surface: POST /api/search/run (do the whole search), GET /api/runs/{id}/trace (return the full bundle), plus helpers for sources/claims/evidence and an MD report.

Frontend (Next.js App Router, Tailwind, frontend/)

/search: run a query, see the answer rendered with clickable [n] citations; right sidebar has Sources (filters) and Analysis (funnel, top domains, coverage matrix).

/insights: “Marketing Intelligence” overview with recent runs, aggregate KPIs, top cited domains, “stored reports,” and subject filtering.

/about: product explainer for non‑engineers.

Export helpers to copy HTML/Markdown and download sources.csv/json + methods.md.

What it’s for (the intent)
Two intertwined goals:

Demonstrate how an AI assistant picks what to cite (educational product explainer for stakeholders/clients).

Measure citation patterns across runs to inform content strategy (which domains win citations, which content types get ignored, how often “our” pages are cited, etc.).

The design (bundle + insights) makes it easy to replay, compare, and mine multiple searches across time/subjects.

How effective is it as a research tool?
Strengths
Clear, auditable data model: every run is a self‑contained bundle (query, sources, claims, evidence, answer, provider results, fetched text). Great for reproducibility and dashboards.

Sentence‑level citations enforced by prompt → you can map every sentence back to source_ids.

Funnel & cross‑run metrics built in (citation rate, top domains). A nice start for “AI SEO” analytics.

Separation of concerns: providers, fetching, composition, analysis are modular and easy to swap/extend.

Current limitations (the stuff that will matter in real research)
Parsing is a stub: fetch_parse.parse_main_text() returns the first 2,000 chars of raw HTML. That means your “evidence” is not grounded to clean article text, which hurts retrieval quality and quote/snippet alignment.

Single provider: only Tavily is used in run_search() (the OpenAI provider exists but isn’t wired). That narrows recall, especially for niche queries.

Credibility/authority is synthetic: sources are created with a flat credibility.score = 0.6, so the “A/B/C/D” bands are not meaningful; category rules are heuristic regexes.

Evidence is unverified: you record which sources a sentence cites, but you don’t extract/align the exact supporting passage (snippet offsets are empty). There’s no “did the sentence actually appear here?” check.

Persistence is not actually “permanent”: the cache layer uses setex with a default TTL (3600s). Comments say “permanent,” but the code still applies a TTL—so bundles and reports can silently expire in Redis memory setups.

Minor API mismatches/bugs:

Store.list_runs() calls CACHE.zrevrange(...) which doesn’t exist (only zrevrange_withscores).

/api/insights/subjects reaches into CACHE.\_redis.keys(...); with memory backend that returns nothing.

LLM analysis & random‑query endpoints expect prompt files that aren’t in the repo (prompts/citation_analysis.md, prompts/random_query.md).

Frontend missing bits (as listed): ViewReport is imported but not present, and styles/globals.css is referenced but not in the tree you shared—both would break the build.

Overall: great demo scaffolding (≈6/10 for research). It proves the shape of the problem and yields useful directional insight, but it needs better parsing, broader search, and stronger evidence/authority scoring to be relied on for rigorous analysis or automated recommendations.

How to improve (concrete, prioritized) 0) Fix the “it should run” blockers (quick wins)
Make storage truly permanent (or explicitly configurable):

Update Cache.set() so Redis uses SET without EX when ttl is None, and memory backend ignores TTL when ttl is None. Right now you always use a TTL (default 3600).

Where you write bundles/reports as “permanent,” pass ttl=None and honor it in Cache.

Add zrevrange or stop calling it: either implement Cache.zrevrange(...) (no scores) or switch Store.list_runs() to zrevrange_withscores(...).

Don’t poke internals: change /api/insights/subjects to use CACHE.keys() rather than CACHE.\_redis.keys(...).

Add the missing files:

backend/app/prompts/citation_analysis.md and backend/app/prompts/random_query.md (your code loads both).

frontend/src/components/ViewReport.tsx (referenced in /search) and frontend/src/styles/globals.css (referenced in layout.tsx).

Generalize scripts/dev.sh: remove the absolute path /Users/jasonryan/Documents/geo; compute ROOT_DIR from the script location so other machines can run it.

1. Evidence quality & parsing (biggest impact on research quality)
   Real article extraction: replace the HTML stub with Readability + trafilatura (or jusText) to get clean body text, title, author, and published date. Keep raw HTML for traceability.

Snippet alignment: when the LLM cites a source, try to quote‑match a key phrase from the sentence into the parsed text and store snippet, start_offset, end_offset. Show those highlights in the UI.

Canonicalization & dedupe: resolve rel=canonical, strip UTM params, hash normalized content; merge duplicates across providers/redirects.

2. Broaden and de‑bias discovery
   Add multiple providers: wire the existing OpenAISearchProvider and consider Bing/Google/SerpAPI. Keep provider scores and positions so you can analyze which provider contributed cited sources.

Better query expansion: replace the TODO with a small LLM prompt that generates 3–6 diverse expansions (synonyms, alternates, jargon vs lay phrasing), and selectively sample those.

3. Authority/recency you can trust
   Real credibility features per source: domain‑level priors (gov/edu/peer‑review > major news > vendor > blog), author signals, inbound links (optional), and recency decay.

Scored, explainable “bands”: compute credibility.score from those features (0–1) and keep the rationale; your UI already renders A/B/C/D.

Paywall detection & accessibility flag (impacts likelihood of AI reading it fully).

4. Composition & validation
   Dual‑pass composition:

retrieve & cite (as today);

verification pass that re‑reads the chosen sources and rejects/rewrites any sentence whose quotes don’t align within tolerance.

Minimum independence rule: enforce that each sentence includes ≥2 domains when possible (you already hint this in the system prompt).

5. Analytics/insights that marketers will love
   Per‑category win rates: fraction of found vs cited by category (gov, edu, news, blog, etc.) and by domain over time.

Keyword → domain matrix: which domains own which topics; trend it by month.

Actionable gaps: “You’re under‑represented in ‘research’ citations for {subject}; publish an explainer with method + dataset to move the needle.”

6. Platform hardening
   Background jobs (RQ/Celery) for fetch/parse and LLM steps; UI can poll status.

Move persistence to Postgres (you already have sqlmodel models) or keep Redis but add snapshot/export—right now memory backend will lose everything on restart.

Observability: structured logs, per‑stage timings, retries; rate‑limit inbound API.

Tests: unit tests for categorization, parsing, and end‑to‑end “golden” bundles for regression.

Small code tweaks (illustrative)
Make “permanent” writes actually permanent

python
Copy

# backend/app/core/cache.py

def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
if self.\_redis is not None:
if ttl is None:
self.\_redis.set(key, value) # no TTL
else:
self.\_redis.setex(key, ttl, value)
return
if ttl is None: # Store with a sentinel "no expiry" (e.g., 10 years) or track separately
self.\_mem[key] = (float("inf"), value)
else:
self.\_mem[key] = (time.time() + ttl, value)
Then call CACHE.set_json(..., ttl=None) for bundles and reports that should persist.

Fix list_runs()

python
Copy

# backend/app/core/store.py

def list*runs(self) -> Dict[str, Dict[str, Any]]:
recent_key = CACHE.ai_key("recent")
items = CACHE.zrevrange_withscores(recent_key, 0, -1)
runs = {}
for run_id, * in items:
bundle = CACHE.get_json(CACHE.ai_key(f"{run_id}"))
if bundle:
runs[run_id] = bundle
return runs
Stop reaching into \_redis

python
Copy

# backend/app/routers/search.py

@router.get("/subjects")
async def get_unique_subjects():
from ..core.cache import CACHE
subjects = set()
for key in CACHE.keys(CACHE.ai_key("\*")):
if "query_hash:" in key or ":analysis:" in key:
continue
bundle = CACHE.get_json(key)
subj = (bundle or {}).get("run", {}).get("subject", "").strip()
if subj:
subjects.add(subj)
return {"subjects": sorted(subjects)}
Sanity checklist (so you can ship a clean demo)
Add the two prompt files under backend/app/prompts/ (citation analysis + random query).

Add ViewReport.tsx and styles/globals.css (or remove references).

Fix cache permanence + list_runs() + /subjects as above.

Swap in real parsing (readability/trafilatura) and store clean raw_text + offsets.

Wire OpenAISearchProvider (opt‑in via env) and keep provider rank/scores in the bundle.

Replace constant credibility.score with a computed score + rationale.

Add a .env.example documenting OPENAI_API_KEY, TAVILY_API_KEY, CACHE_BACKEND=redis, REDIS_URL, PIPELINE_VERSION, etc.

Make scripts/dev.sh path‑agnostic (or add a docker-compose.yml).

If you want, I can turn the above into a short PR patch set (or a backlog with tickets) tailored to your deployment setup.
