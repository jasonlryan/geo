## AI Search with Citations — Implementation Plan

This plan tracks remaining work to deliver the demo described in `product_spec.md`. Current scaffold includes a FastAPI backend with mocked endpoints and a Next.js frontend with basic `/search` and `/trace/[runId]` pages.

### Status (today)

- Backend: FastAPI, in-memory runs; routes for run, sources, claims, evidence, classifications, trace; `.env` loading; OpenAI client placeholder.
- Frontend: Next.js (TS, Tailwind), `/search` UI showing answer, claims, sources; `/trace/[runId]` shows full JSON; API wiring.
- No Supabase; persistence is in-memory for now.

### Gaps vs `product_spec.md`

- Search & retrieval: provider integration, query expansion, fetch/parse, canonicalization, dedupe, ranking.
- Answer & alignment: citation-enforced composition, claims extraction, passage alignment, coverage score, stance detection.
- Classification: taxonomy with confidence, heuristics + LLM validation.
- Analysis: consensus, coverage matrix, timeline, mix charts, novelty/redundancy, risk flags.
- Exports: Answer.md, sources.csv/json, methods.md.
- Persistence & caching: DB schema, caches (content, results, dedupe signatures).
- Observability & trace: run timings, structured logs, show-work JSON completeness.
- Guardrails: robots.txt, safety filters, content-hash change flag.
- Testing & QA: unit tests, golden queries, latency and coverage metrics.

### Architecture notes

- Keep providers pluggable via a small interface. Start with OpenAI Search (or equivalent) and fall back to mock.
- Use SQLite for persistence (replace in-memory store), optional Redis later for caches.
- Keep the citation contract explicit: every answer sentence must reference ≥1 `source_id`.

### Phase 1 — Search & Retrieval (providers, fetch, parse)

- Provider interface `app/services/providers/base.py`
  - `search(query: str, *, limit: int) -> list[ProviderResult]`
  - Fields: `title, url, snippet, published_at|None, provider, score`
- Implement `OpenAISearchProvider` (`providers/openai.py`).
  - Query expansion: generate 3–6 variants (GPT) and dedupe query strings.
  - Aggregate and dedupe provider results by URL.
- Fetch & parse pipeline
  - `Playwright` fetcher (JS pages) with fallback to `httpx`.
  - Respect robots.txt in demo mode.
  - Readability + `trafilatura` main-text extraction.
  - Canonical URL resolution; OG/meta scrape; favicon.
- Caching (initial)
  - On-disk or SQLite-backed cache for raw HTML and parsed text.
  - Key by URL sha256 (`cache:content:{sha}`) with TTL.

### Phase 2 — Embeddings, Dedupe, Ranking

- Embeddings
  - OpenAI `text-embedding-3-small` on parsed text; store vector and content hash.
- Near-duplicate clustering
  - URL canonical rules + cosine threshold (e.g., ≤0.1) to assign cluster IDs.
- Ranking per spec
  - `score = 0.45*bm25 + 0.20*recency + 0.15*authority_prior + 0.10*diversity_bonus + 0.10*clickability`.
  - Implement bm25 over title+body; recency sigmoid; domain prior table; diversity penalty within cluster/domain; clickability from title/snippet.

### Phase 3 — Composition, Claims, Alignment, Coverage

- Composer (LLM) with explicit tool contract
  - Input: top-ranked sources (title, domain, snippets).
  - Output: array of sentences each with `source_ids[]`; also return draft answer text.
- Claims extraction
  - Derive claims from sentences with IDs (`answer_sentence_index`).
- Passage alignment & coverage scoring
  - For each claim×source, extract supporting quote and offsets.
  - Compute coverage: exactness, specificity, recency, authority, stance fidelity.
- Stance detection: supports/contradicts/neutral per alignment.

### Phase 4 — Classification & Analysis

- Classification rules
  - Heuristics + regex + domain priors for Type/Intent/Geography.
  - LLM validation; store `confidence` per label.
- Analysis aggregates
  - Source mix, timeline histogram, coverage per claim, novelty (n-gram Jaccard), redundancy (cluster density), consensus (authority×coverage), risk flags.

### Phase 5 — Persistence, Trace, Guardrails, Exports

- Persistence: migrate to SQLite
  - Tables: `runs, sources, claims, evidence, classifications` per spec.
  - Migrations with Alembic or SQLModel create-all for MVP.
- Trace & observability
  - Store all intermediary data: queries, provider hits, fetch stats, ranking, prompts, alignments.
  - Timings breakdown per step.
- Guardrails
  - robots.txt respect, safety filters for snippets, content hash tracking (flag changes >5%).
- Exports
  - Answer.md (numbered citations), sources.csv & sources.json (with claim links), methods.md (providers, weights, model versions, run/timestamps).

### Phase 6 — UI Build-out

- Left pane: query, filters (date range, domains include/exclude, providers, enforce coverage toggle).
- Center: answer with inline [n] citations; click shows highlighted quote + coverage.
- Right: tabs
  - Sources: table (ID, Title, Domain, Type, Intent, Credibility, Published, Coverage, Stance, Geography) with filters; Source Drawer with snippets and claim links.
  - Analysis: consensus meter, claims×sources heatmap, timeline, mix charts, risk flags (Recharts).
- Exports: copy buttons and downloads.

### Data model & caching (MVP without Supabase)

- SQLite schema mirrors spec. Add indices on `run_id`, `source_id`, `claim_id`.
- Caches: content cache and results cache (SQLite tables or file cache), dedupe signature store.
- Optional Redis: set `CACHE_BACKEND=redis` and `REDIS_URL=...` for shared caching; defaults to in-memory.

### Testing & QA

- Unit tests: canonicalization, parser correctness, classification mapping.
- Golden queries (~10) with saved expected properties; measure coverage, labeling precision, latency.

### Sequencing (10 focused days)

1. Providers + query expansion + minimal ranking + SQLite schema.
2. Fetch/parse + canonicalization + caches.
3. Embeddings + dedupe clustering + ranking refinements.
4. Composer with enforced citations; claims extraction.
5. Alignment + coverage scoring + stance.
6. Classification + Sources table UI + Source Drawer.
7. Analysis aggregates + charts + risk flags.
8. Exports + trace polish.
9. Guardrails + tests + performance pass.
10. QA on golden queries + docs and demo script.

### Immediate next actions

- Introduce SQLite models and replace in-memory store in API routes.
- Implement OpenAI Search provider with query expansion; fall back to mock if no results.
- Persist and expose a full `trace` object including ranking inputs/outputs.
- Add Sources table filters and Source Drawer in the UI.

### Environment & config

- Backend `.env`: `OPENAI_API_KEY=sk-...`
- Frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`

### Non-goals (MVP)

- Supabase auth/DB (can be added later).
- Agentic multi-iteration research loops (optional stretch).
