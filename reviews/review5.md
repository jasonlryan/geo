Add stronger discovery providers (you already have the abstraction):

Brave + Google CSE for recall; Perplexity + OpenRouter(web) as “citation seeds”.
Then keep your rerank_by_authority() and dedup exactly as-is.

Enforce an authority floor before composing.
If < N A/B‑band sources exist → retry with authority‑biased query variants (you already generate them) and call the “citation seed” providers again. Otherwise return “insufficient authority” rather than citing corporate fluff.

Stamp runs with reproducibility metadata.
Extend the run object with: models: {composer, analysis, search}, provider names+limits, query variants used, PIPELINE_VERSION, git SHA, and extraction_method per source (you already record it at doc level; surface it in the run metadata too).

Tighten snippet alignment reporting.
Store alignment_confidence (you already compute it) and roll it up in analysis (mean/median per run; flag low‑confidence claims).

Finish/verify the insights endpoints your UI expects (/api/insights/recent, /api/insights/aggregate) and the runs read APIs. You have the Redis utilities; expose them via FastAPI routers so the dashboard is live.

Preset authority‑first variants when expansion fails.
You already append site:.gov OR site:.edu OR site:.org variants; make at least one such variant mandatory on every run.

Next level (turn this into a publishable methodology)
Calibrate credibility scores with data.
Add a tiny annotation set (100–200 sources across categories) and fit a simple logistic regression or isotonic calibration on features you already compute (category, domain whitelist, recency, length, named author, title signals). Persist cutoffs A/B/C bands from that calibration.

Sentence‑level alignment using embeddings (optional, one extra dep):
For each claim sentence, pick the nearest sentence(s) in the source with a small text‑embedding model (e.g., bge-small or e5-small). Confine to CPU and cache embeddings per source text. That’ll jump your alignment accuracy without heavy infra.

Add a “Coverage & Diversity” metric.
Per answer: % sentences with ≥2 independent domains; # unique domains cited; share of citations by category (gov/edu/research vs corporate). Track this over runs to show improvement as you tune providers.

Versioned experiments.
The code already namespaces Redis keys by PIPELINE_VERSION. Use that to A/B: “Tavily‑only” vs “Tavily+Brave+CSE+Seeds”, and compare funnels and authority share.

Using this to answer “How do we get featured in AI results?”
You’re very close. Add one “playbook” report per target domain (your org or a client):

Query set: author a small canonical set for the topic (10–30 realistic user questions).

Run the pipeline and compute for each query:

Discovery→Citation funnel, plus where your domain shows up (discovered? fetched? cited?).

Authority share of citations vs. discovery (how many gov/edu/research sources “beat” you).

Snippet‑alignment confidence where you were cited (if any).

Gap reasons (LLM analysis you already have can draft this):

“No high‑authority page covering the claim,”

“Thin content (<1000 chars),”

“No named author/date,”

“Title looks marketing (‘trends 2025’) not research”, etc.

Actionable tasks ranked by impact (produce a checklist):

Publish a research‑style page (≥2,000 chars) with named author/date on example.org/research/...

Co‑publish with a .edu partner / submit to reputable journals or think tanks

Earn links/citations from .gov/.edu sources (policy papers, standards)

Re‑title pages with “study/analysis/report/findings” and remove clickbait.

You can stitch this into a single PDF/Markdown export today: you already have analysis_report.py; extend it with a Domain Playbook section that aggregates across runs and emits a prioritized checklist.

Tiny code nits you’ll thank yourself for fixing
Missing router(s): main.py imports .routers.runs, but it’s not in the tree you shared; the UI also expects /api/insights/\*. Make sure those files exist and are wired up.

Consistent model IDs: store OPENAI_MODEL_COMPOSER, OPENAI_MODEL_SEARCH, and OPENAI_MODEL_ANALYSIS inside run so analyses are comparable across time.

Security/robustness: your fetcher uses a very simple UA and no robots handling; that’s fine for research, but consider rate limiting and domain allow‑lists in production.

Error handling: if any provider returns zero, record that per‑provider in the bundle; it’ll help you debug recall gaps.

Bottom line
This is already a credible research platform. Add the extra providers + the authority floor and you’ll dramatically reduce the “why is it citing vendor blogs?” moments. Then calibrate your credibility score and tighten alignment, and you’ll have a repeatable, publishable methodology for advising “how to get cited by AI search.” If you want, I can sketch the exact FastAPI routers you’re missing and a short PR plan to wire in Brave/Google/Perplexity/OpenRouter and the authority floor logic.
