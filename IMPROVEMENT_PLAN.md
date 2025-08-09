# Marketing Intelligence Dashboard – Single Source of Truth

This document merges the Creative Brief and the Implementation Plan.

## Vision

A Bloomberg‑style marketing intelligence dashboard that shows who AI trusts, where your brand stands, and what to publish next—fast, credible, and actionable.

## User Flow

1. One click in the Analysis panel opens the modal
2. Unified loading state while analysis compiles (no partials)
3. Full dashboard renders at once; single Export menu

## What We Deliver

- TL;DR + 3 Key insights + 3 Actions (this quarter)
- Competitive share (top domains; leaders/challengers)
- Owned vs third‑party share, credibility bands, recency index
- Evidence‑linked opportunities: topics to publish, where to publish, format
- Full citations table with filters (type/band/recency)
- Export menu (PDF/MD/CSV/JSON)
- Perceived load < 3s (cached < 500ms)

## Design Principles

- Professional grade: clean hierarchy, spacing, consistent tokens
- Information density with progressive disclosure
- Credibility signals: confidence, freshness, methodology

## Dashboard Architecture

1. Executive Summary (TL;DR, insights, actions)
2. Competitive Intelligence (who AI trusts; share; leader bands)
3. Source Analysis (citations table with filters)
4. Content Strategy (gaps/opportunities; venues; formats)
5. Notable citations (gold‑standard, with how to emulate)

## Implementation Plan (Phases)

### Phase 1: Performance & Data (Day 1–2)

- Generate ONLY JSON analysis on open; defer `report.md` to export
- Limit LLM input: cited + top 5 uncited (≤12), snippets 800–1200 chars
- Compute funnel/top domains/mix locally; pass as context to LLM
- Cache by `run_id` (TTL 60m) with ETag; serve cached instantly
- Timebox page fetch (2.5s); fallback to readability preview

### Phase 2: Narrative Model (Day 2–4)

- Prompt outputs strict schema:
  - `tldr: string`
  - `key_insights: string[3]`
  - `actions_qtr: {title, owner, impact, effort, evidence_ids[]}[3]`
  - `panels`: `competitive_share`, `owned_vs_thirdparty`, `credibility_histogram`, `recency_index`
  - `opportunities: {topic, why_now, suggested_venue, format, evidence_ids[]}[≤6]`
- Server validation/repair of JSON

### Phase 3: UI Rebuild (Day 4–6)

- Large modal (80vw × 90vh), unified loader
- Header: title + Export menu only
- Four sections rendered as per architecture; remove dev clutter

### Phase 4: Exports & Polish (Day 6–7)

- Exports from the same JSON (PDF/MD/CSV/JSON)
- Accessibility, keyboard, empty/error states
- Typography/spacing audit; consistent colors

## Acceptance Criteria

- One click → loader → full dashboard
- TL;DR, 3 insights, 3 actions present and evidence‑linked
- Competitive share + owned vs third‑party visualized
- Opportunities specify topic, venue, format
- Full citations table with filters and working links
- Export menu only; load ≤ 3s cold, ≤ 500 ms cached

## Risks & Mitigations

- LLM variability → strict schema + repair; cap lists
- Latency → caching + trimming + timeboxing; defer exports
- Cost → cap sources; reuse cached analysis

## Sequence

See the flow diagram (created in this session) for the end‑to‑end request path.
