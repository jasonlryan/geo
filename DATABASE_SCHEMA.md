# AI Search Intelligence - Data Storage Schema

## Overview

This document defines the data storage schema for the AI Search Intelligence platform, covering both Redis caching and potential future database persistence.

## Redis Cache Schema

### Primary Keys & TTL Strategy

```redis
# Search Results Cache (24 hours)
ai_search:{run_id} -> JSON (complete search bundle)

# LLM Analysis Cache (1 hour)
ai_search:analysis:{run_id} -> JSON (marketing intelligence)

# Query Cache (30 minutes)
ai_search:query_hash:{hash} -> run_id (deduplication)
```

## Core Data Entities

### 1. Search Run

```typescript
interface SearchRun {
  run_id: string; // UUID
  query: string; // Original user query
  query_hash: string; // SHA256 for deduplication
  created_at: string; // ISO 8601 timestamp
  status: "running" | "completed" | "failed";
  params: {
    filters?: Record<string, any>;
    provider?: string;
    max_sources?: number;
  };
  timings: {
    total_ms: number;
    search_ms?: number;
    fetch_ms?: number;
    compose_ms?: number;
    analysis_ms?: number;
  };
}
```

### 2. Source

```typescript
interface Source {
  source_id: string; // Unique identifier
  run_id: string; // Foreign key to search run
  url: string; // Original URL
  domain: string; // Extracted domain
  title?: string; // Page title
  published_at?: string; // Publication date
  media_type?: string; // article, blog, news, academic, etc.
  raw_text: string; // Extracted content
  credibility_band: "A" | "B" | "C" | "D";
  fetch_status: "success" | "failed" | "timeout";
  fetch_time_ms: number;
  content_length: number;
  metadata: {
    author?: string;
    language?: string;
    word_count?: number;
    structured_data?: any;
  };
}
```

### 3. Claim

```typescript
interface Claim {
  claim_id: string; // Unique identifier
  run_id: string; // Foreign key to search run
  text: string; // The claim text
  answer_sentence_index: number; // Position in answer
  confidence_score?: number;
  topic?: string; // Extracted topic/theme
}
```

### 4. Evidence (Citation Link)

```typescript
interface Evidence {
  evidence_id: string; // Unique identifier
  run_id: string; // Foreign key to search run
  claim_id: string; // Links to claim
  source_id: string; // Links to source
  snippet: string; // Cited text snippet
  start_offset: number; // Character position in source
  end_offset: number; // Character position in source
  confidence_score?: number;
  citation_type: "direct_quote" | "paraphrase" | "supporting_data";
}
```

### 5. Answer

```typescript
interface Answer {
  run_id: string; // Foreign key to search run
  text: string; // Complete answer text
  citations: Array<{
    index: number; // Citation number [1], [2], etc.
    source_id: string; // Links to source
    start_char: number; // Position in answer text
    end_char: number; // Position in answer text
  }>;
  word_count: number;
  generation_time_ms: number;
}
```

### 6. Analysis (Basic Metrics)

```typescript
interface Analysis {
  run_id: string; // Foreign key to search run
  funnel: {
    proposed: number; // Sources found by search
    fetched: number; // Sources successfully downloaded
    cited: number; // Sources actually referenced
  };
  coverage: {
    total_claims: number;
    cited_claims: number;
    coverage_rate: number; // Percentage
  };
  domains: {
    total_unique: number;
    cited_unique: number;
    top_domains: Array<{
      domain: string;
      source_count: number;
      citation_count: number;
    }>;
  };
  content_types: Record<
    string,
    {
      count: number;
      citation_rate: number;
    }
  >;
}
```

### 7. LLM Analysis (Marketing Intelligence)

```typescript
interface LLMAnalysis {
  run_id: string; // Foreign key to search run
  generated_at: string; // ISO 8601 timestamp
  model_version: string; // gpt-4o-mini, etc.

  ai_search_intelligence: {
    selection_patterns: {
      preferred_source_types: string[];
      preferred_content_formats: string[];
      key_authority_signals: string[];
      citation_success_factors: string[];
    };
    competitive_landscape: {
      market_saturation: "low" | "medium" | "high";
      opportunity_level: "poor" | "good" | "excellent";
      winning_domains: string[];
      content_gaps: string[];
      authority_patterns: Record<string, number>;
    };
  };

  visibility_intelligence: {
    citation_success_rate: number;
    content_performance: {
      high_performing_types: string[];
      low_performing_types: string[];
    };
    recommendations: {
      immediate_actions: string[];
      quarterly_priorities: string[];
      content_formats: string[];
    };
  };

  raw_llm_response: string; // Full JSON from LLM
  generation_time_ms: number;
}
```

### 8. Provider Results (Search API Responses)

```typescript
interface ProviderResult {
  run_id: string; // Foreign key to search run
  provider: string; // tavily, openai, etc.
  query_variant: string; // The specific query sent
  status: "success" | "failed" | "timeout";
  response_time_ms: number;
  results: Array<{
    url: string;
    title: string;
    snippet: string;
    score?: number;
    rank: number;
  }>;
  metadata: {
    total_results?: number;
    api_cost?: number;
    rate_limited?: boolean;
  };
}
```

## Redis Storage Implementation

### Cache Structure

```typescript
// Primary search bundle cache
const searchBundle = {
  run: SearchRun,
  sources: Source[],
  claims: Claim[],
  evidence: Evidence[],
  answer: Answer,
  analysis: Analysis,
  provider_results: ProviderResult[]
};

// LLM analysis cache
const analysisCache = {
  llm_analysis: LLMAnalysis,
  cached_at: string,
  ttl_seconds: number
};
```

### Redis Commands

```typescript
// Store complete search bundle
await redis.setex(
  `ai_search:${runId}`,
  86400, // 24 hours
  JSON.stringify(searchBundle)
);

// Store LLM analysis
await redis.setex(
  `ai_search:analysis:${runId}`,
  3600, // 1 hour
  JSON.stringify(analysisCache)
);

// Query deduplication
const queryHash = sha256(query + JSON.stringify(params));
await redis.setex(
  `ai_search:query_hash:${queryHash}`,
  1800, // 30 minutes
  runId
);
```

## Future Database Schema (SQLite/PostgreSQL)

### Tables

```sql
-- Search runs
CREATE TABLE search_runs (
  run_id UUID PRIMARY KEY,
  query TEXT NOT NULL,
  query_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  params JSONB,
  timings JSONB,
  INDEX(query_hash),
  INDEX(created_at)
);

-- Sources discovered
CREATE TABLE sources (
  source_id VARCHAR(50) PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES search_runs(run_id),
  url TEXT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  title TEXT,
  published_at TIMESTAMP,
  media_type VARCHAR(50),
  raw_text TEXT,
  credibility_band CHAR(1),
  fetch_status VARCHAR(20),
  fetch_time_ms INTEGER,
  content_length INTEGER,
  metadata JSONB,
  INDEX(run_id),
  INDEX(domain),
  INDEX(credibility_band)
);

-- Claims extracted from answer
CREATE TABLE claims (
  claim_id VARCHAR(50) PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES search_runs(run_id),
  text TEXT NOT NULL,
  answer_sentence_index INTEGER NOT NULL,
  confidence_score FLOAT,
  topic VARCHAR(100),
  INDEX(run_id)
);

-- Evidence linking claims to sources
CREATE TABLE evidence (
  evidence_id VARCHAR(50) PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES search_runs(run_id),
  claim_id VARCHAR(50) NOT NULL REFERENCES claims(claim_id),
  source_id VARCHAR(50) NOT NULL REFERENCES sources(source_id),
  snippet TEXT NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  confidence_score FLOAT,
  citation_type VARCHAR(20),
  INDEX(run_id),
  INDEX(claim_id),
  INDEX(source_id)
);

-- Generated answers
CREATE TABLE answers (
  run_id UUID PRIMARY KEY REFERENCES search_runs(run_id),
  text TEXT NOT NULL,
  citations JSONB NOT NULL,
  word_count INTEGER,
  generation_time_ms INTEGER
);

-- Basic analysis metrics
CREATE TABLE analysis (
  run_id UUID PRIMARY KEY REFERENCES search_runs(run_id),
  funnel JSONB NOT NULL,
  coverage JSONB NOT NULL,
  domains JSONB NOT NULL,
  content_types JSONB
);

-- LLM-generated marketing analysis
CREATE TABLE llm_analysis (
  run_id UUID PRIMARY KEY REFERENCES search_runs(run_id),
  generated_at TIMESTAMP NOT NULL,
  model_version VARCHAR(50),
  ai_search_intelligence JSONB,
  visibility_intelligence JSONB,
  raw_llm_response TEXT,
  generation_time_ms INTEGER
);
```

## Data Relationships

```
SearchRun (1) -> (N) Sources
SearchRun (1) -> (N) Claims
SearchRun (1) -> (1) Answer
SearchRun (1) -> (1) Analysis
SearchRun (1) -> (1) LLMAnalysis

Claims (N) -> (N) Sources (via Evidence)
Evidence links Claims to Sources with citation details
```

This schema ensures:
✅ Complete data lineage from search to citation
✅ Efficient Redis caching for performance  
✅ Future database migration path
✅ Marketing intelligence tied to actual search results
✅ Deduplication and performance optimization
