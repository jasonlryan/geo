# Redis Cache Data Structure for AI Search Intelligence

## Cache Key Strategy

```
ai_search:{run_id} -> Complete search bundle (JSON)
ai_search:analysis:{run_id} -> LLM analysis result (JSON)
```

## Primary Cache Structure: `ai_search:{run_id}`

```json
{
  "run": {
    "run_id": "uuid",
    "query": "What criteria do executive search firms use for EI evaluation?",
    "created_at": "2025-08-09T19:19:25.407Z",
    "params": {},
    "timings": {"total_ms": 8500}
  },
  "sources": [
    {
      "source_id": "src_001",
      "url": "https://kinsleysarn.com/ei-assessment-guide",
      "domain": "kinsleysarn.com",
      "title": "Emotional Intelligence Assessment in Executive Search",
      "published_at": "2024-01-15",
      "media_type": "article",
      "raw_text": "Leading firms evaluate EI through...",
      "credibility_band": "A"
    }
  ],
  "claims": [
    {
      "claim_id": "claim_001",
      "text": "Executive search firms evaluate EI through structured interviews",
      "answer_sentence_index": 0
    }
  ],
  "evidence": [
    {
      "evidence_id": "ev_001",
      "claim_id": "claim_001",
      "source_id": "src_001",
      "snippet": "structured interviews and psychometric assessments",
      "start_offset": 120,
      "end_offset": 180
    }
  ],
  "answer": {
    "text": "Leading executive search firms evaluate candidates' emotional intelligence (EI) through various criteria, focusing on self-awareness, empathy, and interpersonal skills. [5] [7]",
    "citations": [
      {"index": 5, "source_id": "src_001"},
      {"index": 7, "source_id": "src_002"}
    ]
  },
  "analysis": {
    "funnel": {
      "proposed": 15,
      "fetched": 12,
      "cited": 3
    },
    "coverage": {
      "total_claims": 4,
      "cited_claims": 3,
      "coverage_rate": 75
    }
  },
  "provider_results": [
    {
      "provider": "tavily",
      "query": "executive search emotional intelligence criteria",
      "results": [...]
    }
  ],
  "fetched_docs": [
    {
      "url": "https://kinsleysarn.com/ei-assessment-guide",
      "status": "success",
      "content_length": 4500,
      "fetch_time_ms": 850
    }
  ]
}
```

## Secondary Cache: `ai_search:analysis:{run_id}`

```json
{
  "ai_search_intelligence": {
    "selection_patterns": {
      "preferred_source_types": [
        "industry_expert",
        "academic",
        "professional_guide"
      ],
      "preferred_content_formats": [
        "structured_assessment",
        "research_findings",
        "case_studies"
      ],
      "key_authority_signals": [
        "domain_expertise",
        "structured_content",
        "data_driven"
      ],
      "citation_success_factors": [
        "specific_methodology",
        "quotable_examples",
        "authoritative_tone"
      ]
    },
    "competitive_landscape": {
      "market_saturation": "medium",
      "opportunity_level": "good",
      "winning_domains": ["kinsleysarn.com", "russellreynolds.com"],
      "content_gaps": ["diversity_in_ei_assessment", "remote_ei_evaluation"],
      "authority_patterns": {
        "government": 0,
        "academic": 1,
        "industry_expert": 2,
        "corporate": 0
      }
    }
  },
  "visibility_intelligence": {
    "citation_success_rate": 25,
    "content_performance": {
      "high_performing_types": ["assessment_guides", "methodology_papers"],
      "low_performing_types": ["company_descriptions", "service_pages"]
    },
    "recommendations": {
      "immediate_actions": [
        "Create structured EI assessment methodology guide",
        "Add specific evaluation criteria and examples",
        "Include research data and success metrics"
      ]
    }
  }
}
```

## Cache Implementation Strategy

### TTL (Time To Live)

```
ai_search:{run_id} -> 24 hours (search results)
ai_search:analysis:{run_id} -> 1 hour (LLM analysis)
```

### Redis Data Types

```python
# Store as JSON strings
redis.setex(
    f"ai_search:{run_id}",
    86400,  # 24 hours
    json.dumps(search_bundle)
)

redis.setex(
    f"ai_search:analysis:{run_id}",
    3600,   # 1 hour
    json.dumps(llm_analysis)
)
```

## Dashboard Data Flow

```
1. User runs search -> Cache complete bundle under ai_search:{run_id}
2. User opens intelligence modal -> Check ai_search:analysis:{run_id}
3. If analysis cache miss -> Load ai_search:{run_id} + generate analysis -> Cache result
4. If analysis cache hit -> Return cached analysis immediately
5. Dashboard renders using BOTH cached search data + analysis data
```

## Critical Data Requirements for Dashboard

### For "Who Gets Cited" Analysis:

- `evidence[]` - Links claims to source_ids
- `sources[]` - Source metadata for cited source_ids
- `answer.citations[]` - Citation markers in answer

### For "Why Sources Get Ignored":

- `sources[]` - All discovered sources
- `evidence[]` - Which ones got cited (filter for non-cited)
- `provider_results[]` - Original search results

### For Performance Metrics:

- `analysis.funnel` - Proposed -> Fetched -> Cited pipeline
- `analysis.coverage` - Citation success rates
- `sources.length` vs `evidence.length` - Success ratios

## Cache Warming Strategy

```python
# After search completes, immediately cache
cache_search_bundle(run_id, complete_bundle)

# Optionally pre-generate analysis in background
if should_precompute_analysis(query_type):
    analysis = generate_llm_analysis(complete_bundle)
    cache_analysis(run_id, analysis)
```

This structure ensures the dashboard has ALL the data it needs to show cited vs non-cited sources, perform accurate analysis, and generate meaningful marketing intelligence.
