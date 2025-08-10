Here you go — the full spec pasted directly into the chat:

# AI Search with Citations — Demo System Specification (Runbook)

## 0) Purpose & Demo Goals

**Goal:** Build a _demo_ that takes any user query, performs an AI-assisted web search, then **lists, classifies, and analyses the citations** behind the AI’s answer. The demo must visibly prove where claims came from, how sources differ, and what gaps or conflicts exist.

**Audience:** product leaders, data/AI engineers, research/insight teams, enterprise buyers.

**North-star demo moments:**

- Inline numbered citations beside each claim.
- Source table with rich metadata & filters (domain, type, date, credibility, stance).
- Automatic classification (taxonomy + confidence per class) with editable labels.
- Analysis view: consensus vs disagreement, timeline, credibility mix, novelty, gaps.
- One-click “Show work” trace: search queries → fetched docs → extracted claims → mapping to citations.

**MVP success criteria:**

- < 10s perceived latency for a typical query (cached after first run).
- ≥ 90% of answer sentences have at least one citation with coverage ≥ 0.6.
- Clear visual separation between facts (with citations) vs speculation (flagged).

---

## 1) User Flow (End-to-End)

1. **Enter query** → (optional) set filters: date range, regions, domains to include/exclude.
2. **Run** → system executes multi-engine search, expands with query variants, fetches top N results, dedupes, and resolves canonical URLs.
3. **Compose draft answer** with inline references like \[1], \[2–3].
4. **List citations** in a side panel table; show key metadata and a credibility score.
5. **Classify** each citation (type, topic, intent, geography, media type, paywall) with confidence.
6. **Analyse** the set: agreement/stance, recency, coverage per claim, contradictions, gaps.
7. **Explore**: click a claim → see supporting citations, highlighted quotes, and coverage score; click a source → see extracted snippets and which claims it supports or contradicts.
8. **Export**: copy markdown/HTML answer with numbered citations; download CSV/JSON of sources & labels; export a “methods” appendix.

---

## 2) Technical Architecture

**Stack (suggested):**

- **Frontend:** Next.js (React), Tailwind, shadcn/ui, Recharts. Client routes: `/search`, `/trace/:runId`.
- **Backend:** FastAPI (Python) or Node (NestJS). Use **Supabase Auth** (email/OAuth) and **Postgres** for persistence. **Redis** for caching (result cache + content cache + dedupe signatures). Optional: Upstash Redis.
- **Search Providers:** Brave Search API, Bing Web Search, Tavily (meta-search), and custom site: filters. Pluggable provider interface.
- **Fetchers:** Playwright (headless) for robust HTML fetch + JS render; fall back to `httpx` for simple pages. Respect robots.txt in demo mode.
- **Parsing:** Readability + trafilatura for main text; boilerplate removal; canonical URL resolution; favicon + OG meta scrape.
- **Embeddings & Dedup:** OpenAI text-embedding-3-large (or small) to compute similarity for near-duplicate clustering.
- **LLM Orchestration:**

  - **Answer composer:** GPT-5 (reasoning) with tool-use for retrieval calls; temperature 0.2.
  - **Citation extraction & alignment:** GPT-4o-mini or small reasoning model to map claims ↔ evidence.
  - **Classifier:** lightweight zero-shot adapter (few-shot prompt) or small fine-tuned model for taxonomy.

- **Observability:**

  - Structured run logs; trace graph (OpenTelemetry), latency breakdown, token usage.
  - “Show work” JSON persisted per run (for the demo toggle).

**High-level sequence:**

1. Query → 2) Query expansion (LLM generates 3–6 variants) → 3) Parallel multi-engine search (top 10 each) → 4) URL normalization & dedupe (domain+path+canonical, cosine≤0.1 cluster) → 5) Fetch & parse (retry policy) → 6) Rank sources (BM25 over page text + recency boost + authority priors) → 7) Draft answer (LLM) with **explicit tool contract** that _must_ cite sources by ID for each claim → 8) Align claims to passages (quote extraction + offsets) & compute **coverage score** → 9) Classify sources → 10) Analysis aggregates → 11) UI render.

---

## 3) Citation Handling (Accuracy, Traceability, Relevance)

**Stored metadata per source:**

```json
{
  "source_id": "src_8f2a...",
  "title": "...",
  "url": "https://...",
  "domain": "example.com",
  "canonical_url": "https://...",
  "author": "Name | null",
  "publisher": "Name | null",
  "published_at": "2025-08-06T12:30:00Z | null",
  "accessed_at": "2025-08-09T06:15:00Z",
  "content_hash": "sha256:...",
  "word_count": 1840,
  "media_type": "news|blog|paper|gov|dataset|video|forum",
  "geography": "GB|US|EU|Global|Unknown",
  "paywall": false,
  "credibility": {
    "score": 0.72,
    "rationale": "domain age + wiki presence + citations density"
  },
  "snippets": [{ "text": "…", "start": 1024, "end": 1188 }],
  "claims_supported": ["c1", "c3"],
  "claims_contradicted": ["c2"],
  "tags": ["AI policy", "Monetary policy"]
}
```

**Coverage score (per claim×source):**

- **Exactness (0–0.4):** lexical + semantic similarity of claim to passage.
- **Specificity (0–0.2):** whether the passage states the _specific_ numbers/dates/entities.
- **Recency (0–0.1):** newer sources (if query is time-sensitive).
- **Authority (0–0.15):** publisher prior (gov/edu/peer-review > news > blogs), configurable.
- **Stance fidelity (0–0.15):** match between claim polarity and passage stance.

**Dedupe & canonicalization:**

- Cluster by cosine distance on embeddings + URL canonical rules; pick representative with highest content quality.

**Traceability rules:**

- Every sentence in the final answer must carry ≥1 citation ID.
- Hover on \[n] → show the exact quoted span with offsets; link opens the source at anchor (if possible).
- Store `content_hash`; show “Content changed since run” if live page hash differs > 5%.

---

## 4) Classification Rules (Taxonomy & Confidence)

**Taxonomy (editable):**

- **Type:** news, blog, gov, academic/paper, dataset, corporate PR, forum/social, video.
- **Intent:** reporting, analysis, opinion, marketing, documentation, research.
- **Topic:** dynamic (LLM proposes 1–3 topics from a controlled vocabulary).
- **Credibility band:** A (≥0.8), B (0.6–0.79), C (0.4–0.59), D (<0.4).
- **Freshness:** breaking (<48h), recent (≤30d), stale (>30d), historical (>2y).
- **Geography:** country/region inferred from TLD, org, and text cues.
- **Stance (vs key claim):** supports, contradicts, neutral/irrelevant.

**Determination logic:**

- Regex + domain priors (\*.gov, \*.ac.uk → gov/academic).
- Heuristics: presence of abstract/DOI → academic; presence of press-release boilerplate → PR; `rel=canonical` to newsroom.
- LLM validation pass to resolve ambiguous cases; store **confidence** per label.

---

## 5) Analysis Methods (Quant + Qual)

**Quantitative:**

- **Source mix:** count & % by type, credibility band, geography.
- **Timeline:** histogram of published_at; “recency index”.
- **Coverage per claim:** #sources supporting, #contradicting, average coverage score.
- **Novelty:** Jaccard overlap of n-grams across sources → highlight unique contributions.
- **Redundancy:** cluster density; effective number of independent sources.
- **Authority-weighted consensus:** weighted vote using credibility×coverage.

**Qualitative:**

- **Cross-source synthesis:** LLM creates a synthesis with clear provenance sections.
- **Contradiction brief:** auto-generated note explaining why sources disagree (date mismatch, methodology, definition differences).
- **Gap analysis:** topics or entities prominent in query but under-evidenced in sources.
- **Risk flags:** paywalled linchpin, single-source dependency, outdated keystone.

---

## 6) Output & UI Spec

**Layout:** 3-pane responsive web app.

- **Left: Query & Controls** (query box, filters, provider toggles, temperature, “Enforce citation coverage”).
- **Center: Answer** with inline \[1], \[2–3]. Buttons: Copy Markdown, Copy HTML, Export Report.
- **Right: Sources & Analysis** tabs.

**Sources Tab (table):**
Columns: ID, Title, Domain, Type, Intent, Credibility, Published, Coverage (max across claims), Stance, Geography. Filters + sort. Row click → Source Drawer (snippets, which claims it supports, raw text preview).

**Analysis Tab (cards & charts):**

- **Consensus Meter:** e.g., 74% authority-weighted agreement.
- **Coverage Map:** claims × sources matrix heatmap (click to drill).
- **Timeline chart** of publications.
- **Mix charts:** bars for type, credibility band, geography.
- **Risk flags** list.

**Exports:**

- **Answer.md** (Markdown with numbered citations).
- **sources.csv** (flat table) & **sources.json** (full graph including claim links).
- **methods.md** (search strings, providers, ranking weights, model versions, run ID, timestamps).

---

## 7) Example Demonstration (Simulated)

> **Sample query:** _“What are the main risks and benefits of using Retrieval-Augmented Generation (RAG) for enterprise search in 2025?”_

**Answer (excerpt):**
RAG can **improve factuality** by grounding answers in enterprise documents \[1,4], but quality depends heavily on **document governance and chunking strategy** \[2]. **Latency and cost** rise with larger corpora unless caching and selective retrieval are used \[3,5]. RAG also introduces **freshness advantages** over pre-trained models \[1], yet may **leak sensitive data** if connectors and prompts aren’t access-controlled \[6].

**Citations (simulated for demo):**

1. (gov/guide, A, 2025-03-18) _Enterprise AI Assurance: Retrieval Systems_ — `gov.uk/ai-assurance/rag-guide`
2. (blog/analysis, B, 2024-11-02) _Chunking Strategies for RAG at Scale_ — `openai.com/research/chunking-best-practices`
3. (paper, A, 2024-09-15) _Efficient Negative Sampling for Dense Retrievers_ — `arxiv.org/abs/2409.12345`
4. (doc, A, 2025-01-22) _Vector Store Security Considerations_ — `cloudprovider.example/docs/rag-security`
5. (blog, B, 2025-04-10) _Caching Patterns for RAG_ — `engineering.example.com/rag-caching`
6. (doc, A, 2025-02-03) _Zero-Trust Connectors for LLMs_ — `security.example.com/zt-connectors`

**Classification (auto):**

- Type mix: gov (1), blog (2), paper (1), docs (2).
- Intent: 3× analysis, 2× documentation, 1× guidance.
- Credibility: A×4, B×2. Freshness: 4 recent (≤6m), 2 historical (>6m).
- Stance vs key claims: support=5, contradict=0, neutral=1.

**Analysis highlights:**

- **Consensus** (weighted): 82% that governance/chunking is critical; 76% that latency/cost increase with scale.
- **Gaps:** No independent field study data; over-reliance on vendor docs.
- **Risk flags:** Keystone source #1 is single point for assurance guidance; recommend adding 2–3 academic/industry audits.

_(Note: all references above are illustrative for demo; swap for real results in live run.)_

---

## 8) Extensibility

- **Multilingual:** switch tokenizer; add language detector → route to multilingual embedding model; translate UI labels.
- **Enterprise connectors:** SharePoint, Google Drive, Confluence, Slack. Enforce document-level ACL in retrieval and citation display.
- **Cross-domain analysis:** auto-facet by department, repository, or collection; show cross-collection contradictions.
- **Agentic research mode:** iterative search-read-plan loops with guardrails.
- **Human-in-the-loop:** label editor for taxonomy; corrections feed evaluation and fine-tuning.

---

## 9) Data Model & Storage

**Postgres (simplified DDL):**

```sql
create table runs (
  run_id uuid primary key,
  query text not null,
  created_at timestamptz not null default now(),
  params jsonb,
  timings jsonb
);

create table sources (
  source_id uuid primary key,
  run_id uuid references runs(run_id),
  url text,
  canonical_url text,
  domain text,
  title text,
  author text,
  publisher text,
  published_at timestamptz,
  accessed_at timestamptz,
  media_type text,
  geography text,
  paywall boolean,
  credibility jsonb,
  content_hash text,
  word_count int,
  raw_text text
);

create table claims (
  claim_id uuid primary key,
  run_id uuid references runs(run_id),
  text text,
  importance numeric,
  answer_sentence_index int
);

create table evidence (
  claim_id uuid references claims(claim_id),
  source_id uuid references sources(source_id),
  coverage_score numeric,
  stance text,
  snippet text,
  start_offset int,
  end_offset int,
  primary key (claim_id, source_id)
);

create table classifications (
  source_id uuid references sources(source_id),
  label_key text,
  label_value text,
  confidence numeric,
  primary key (source_id, label_key)
);
```

**Redis keys:**

- `cache:search:{hash(query+filters)}` → provider results (TTL 1–6h).
- `cache:content:{sha256(url)}` → parsed article text (TTL 7d).
- `dedupe:signature:{sha256(normalized_url)}` → cluster ID.

---

## 10) Ranking & Scoring

**Source ranking score:**

```
score = 0.45 * bm25 + 0.20 * recency + 0.15 * authority_prior + 0.10 * diversity_bonus + 0.10 * clickability
```

- **bm25:** search query match on title+body.
- **recency:** sigmoid(decay by days).
- **authority_prior:** domain prior table (gov/edu/news/repo).
- **diversity_bonus:** penalize near-duplicates within same domain/cluster.
- **clickability:** title quality + snippet coherence.

---

## 11) Guardrails, Privacy, Compliance

- Respect robots.txt and `noarchive` in demo mode; obey per-provider TOS.
- Strip PII; don’t store cookies/session unless required; redact tokens in logs.
- Mark simulated outputs clearly; label uncertainty on low-coverage claims.
- Safety filters for unsafe content (violence, explicit, hate) to avoid rendering problematic snippets in public demos.

---

## 12) Evaluation & QA

- **Unit tests:** URL canonicalization, parser correctness, classification mapping.
- **Golden set:** 25 queries with curated source lists; measure coverage, precision of labels, latency.
- **Human review UI:** triage mislabels; regenerate with different weights; compare runs (A/B) and lock “golden” runs for demo.

---

## 13) Implementation Plan (MVP → Stretch)

**Week 1 (MVP):** provider integrations, fetch/parse, dedupe, table UI, basic inline citations.

**Week 2:** coverage alignment, taxonomy classifier, analysis charts, exports.

**Week 3 (Stretch):** quote anchors on page, stance detection, novelty analysis, full trace UI.

---

## 14) Demo Script (2–3 minutes)

1. **Setup:** “We’ll ask a question and watch the system find and _prove_ answers.”
2. **Type query** (e.g., “How will UK rate cuts affect fixed-rate mortgages?”) and click **Run**.
3. **Narrate search:** show provider toggles flickering; reveal the **Sources** tab populating.
4. **Answer appears** with \[1], \[2–3]. Click \[2] → show highlighted quote and coverage 0.78.
5. Switch to **Analysis:** call out **Consensus Meter** and **Timeline**; highlight a **Risk flag** (“single vendor doc”).
6. **Filter sources** to only gov/academic; watch answer _re-compose_ with different citations.
7. **Export** → copy markdown, show **methods.md** for reproducibility.
8. **Close:** “Every claim is traceable; you can see mix, stance, and gaps at a glance.”

---

## 15) What to Prepare for the Live Demo

- 3–5 seeded queries with cached runs.
- At least one query that produces a **contradiction** for the “disagreement” showcase.
- A slow/JS-heavy page to show Playwright rendering vs fallback.
- A paywalled source to show paywall flag and alternative sourcing.
- A bad-credibility domain to demonstrate credibility banding.

---

## 16) Optional Enhancements

- **Co-citation network graph** (force-directed) to visualize how sources cluster around claims.
- **Source provenance badges** (peer-reviewed, primary data, official stats).
- **Evaluator mode** with rubric scoring (coverage, novelty, consistency).
- **Live diffing** when a source changes content hash post-run.
- **Reviewer notes** and redlines that can be exported with the report.

---

If you want, I can now add:

- an **OpenAPI spec**,
- the **prompt templates** for composer/classifier/aligner,
- and a minimal **Next.js + FastAPI skeleton** (with mocked search results)
  so you can run the demo locally.
