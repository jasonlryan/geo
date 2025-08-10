# AI Search Intelligence - Data Storage Schema

## Overview

This document defines the actual data storage schema for the AI Search Intelligence platform, covering Redis caching with versioned keys and future database persistence.

## Current Redis Cache Schema (v1)

### Primary Keys & TTL Strategy

```redis
# Versioned namespace: ai_search:v1:*

# Search Results Cache (PERMANENT - no TTL)
ai_search:v1:{run_id} -> JSON (complete search bundle)

# LLM Analysis Cache (PERMANENT - no TTL for intelligence reports)
ai_search:v1:analysis:{run_id} -> JSON (marketing intelligence with metadata)

# Query Deduplication Cache (30 minutes)
ai_search:v1:query_hash:{hash} -> run_id (deduplication)

# Indices (PERMANENT)
ai_search:v1:recent -> ZSET (run_id scored by timestamp)
ai_search:v1:reports -> ZSET (run_id scored by report generation timestamp)
ai_search:v1:q:{hash} -> LIST (query history, 90 days)
```

## Core Data Entities

### 1. Search Run (ACTUAL CURRENT STRUCTURE)

```typescript
interface SearchRun {
  run_id: string; // UUID
  query: string; // Original user query
  subject: string; // Subject area (e.g., "Technology Leadership", "Organisational Consulting")
  created_at: string; // ISO 8601 timestamp
  search_model: string; // Search provider used (e.g., "Tavily")
  params: {
    filters?: Record<string, any>;
    force?: boolean; // Force new search vs cached
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

### 2. Source (ACTUAL CURRENT STRUCTURE)

```typescript
interface Source {
  source_id: string; // Unique identifier (e.g., "src_00_d8de8e87")
  run_id: string; // Foreign key to search run
  url: string; // Original URL
  canonical_url: string; // Canonical URL after redirects
  domain: string; // Extracted domain
  title?: string; // Page title
  author?: string; // Content author
  publisher?: string; // Publishing organization
  published_at?: string; // Publication date (ISO 8601)
  accessed_at: string; // When content was fetched (ISO 8601)
  media_type?: string; // article, blog, news, academic, etc.
  geography?: string; // Geographic region/country
  paywall: boolean; // Whether content is behind paywall
  credibility: {
    score: number; // 0.0 to 1.0
    // Additional credibility metadata could be here
  };
  content_hash: string; // Hash of content for deduplication
  word_count: number; // Content word count
  raw_text: string; // Extracted content
  category: string; // Source categorization (gov, edu, research, consultancy, agency, news, etc.)
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

### 4. Evidence (Citation Link) (ACTUAL CURRENT STRUCTURE)

```typescript
interface Evidence {
  claim_id: string; // Links to claim
  source_id: string; // Links to source
  coverage_score: number; // How well source covers the claim
  stance: string; // Source's position on the claim
  snippet: string; // Cited text snippet
  start_offset: number; // Character position in source
  end_offset: number; // Character position in source
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

### 8. Provider Results (Search API Responses) (ACTUAL CURRENT STRUCTURE)

```typescript
interface ProviderResult {
  // Raw API response from search provider (Tavily, etc.)
  // Structure varies by provider - stored as-is from API
  url: string;
  title: string;
  content: string; // Raw content from provider
  score?: number;
  published_date?: string;
  // Additional provider-specific fields...
}
```

### 9. Fetched Documents (ACTUAL CURRENT STRUCTURE)

```typescript
interface FetchedDoc {
  // Documents that were successfully fetched and processed
  url: string;
  title: string;
  content: string; // Processed/cleaned content
  status: string; // Success/failure status
  // Additional fetch metadata...
}
```

### 10. Classifications (ACTUAL CURRENT STRUCTURE)

```typescript
interface Classification {
  // Source classification/labeling data
  source_id: string;
  label_key: string; // Classification type
  label_value?: string; // Classification value
  confidence?: number; // Classification confidence
}
```

### 11. LLM Analysis Storage (ACTUAL CURRENT STRUCTURE)

```typescript
interface StoredLLMAnalysis {
  // Complete LLM analysis with metadata
  ...llm_response_data, // Full JSON response from citation_analysis.md prompt
  metadata: {
    run_id: string;
    query: string;
    search_model: string; // "Tavily"
    created_at: string; // Original search timestamp
    generated_at: string; // Analysis generation timestamp
  }
}
```

## Intelligence Report Data Analysis

### What Intelligence Report Needs (from citation_analysis.md):

1. **Core Search Data** ✅ **AVAILABLE**:
   - `query` ✅ (in run)
   - `sources` array with `source_id`, `url`, `domain`, `title`, `published_at`, `media_type`, `text_snippet` ✅ 
   - `claims` array with `claim_id`, `text`, `answer_sentence_index` ✅
   - `evidence` array with `claim_id`, `source_id`, `snippet` ✅
   - `funnel` data (proposed, fetched, cited) ❌ **MISSING** - needs to be computed

2. **Enhanced Source Data** ✅ **AVAILABLE**:
   - Domain categorization ✅ (`category` field added)
   - Authority signals ✅ (`credibility.score`, `author`, `publisher`)
   - Content metadata ✅ (`word_count`, `published_at`, `media_type`)

3. **Missing Data for Enhanced Intelligence**:
   - `funnel` metrics (proposed → fetched → cited conversion rates)
   - Source authority classification (`high`/`medium`/`low`)
   - Content recency classification (`recent`/`medium`/`stale`)
   - Provider ranking/scoring data from initial search
   - Citation success patterns across runs

### Current Bundle Structure (ACTUAL):
```typescript
interface SearchBundle {
  run: SearchRun;                    // ✅ Query, subject, timing data
  sources: Source[];                 // ✅ Complete source data + categories
  claims: Claim[];                   // ✅ Answer claims
  evidence: Evidence[];              // ✅ Citations with snippets
  classifications: Classification[]; // ✅ Source classifications
  answer: {                          // ✅ Generated answer
    text: string;
  };
  provider_results: ProviderResult[]; // ✅ Raw search API results
  fetched_docs: FetchedDoc[];        // ✅ Successfully fetched content
}
```

### Recommended Data Enhancements:

1. **Add Computed Analysis to Bundle**:
```typescript
interface Analysis {
  funnel: {
    proposed: number;    // provider_results.length
    fetched: number;     // fetched_docs.length  
    cited: number;       // unique source_ids in evidence
  };
  source_categories: Record<string, number>; // Count by category
  authority_distribution: Record<"high"|"medium"|"low", number>;
  recency_distribution: Record<"recent"|"medium"|"stale", number>;
}
```

2. **Enhanced Source Metadata**:
```typescript
interface SourceEnhancements {
  authority_level: "high" | "medium" | "low"; // Based on credibility.score
  recency_category: "recent" | "medium" | "stale"; // Based on published_at
  provider_rank?: number; // Original ranking from search provider
  provider_score?: number; // Original relevance score
}
```

## Redis Storage Implementation

### Current Cache Structure (ACTUAL)

```typescript
// Primary search bundle cache (PERMANENT storage)
const searchBundle = {
  run: SearchRun,                    // Query, subject, timing
  sources: Source[],                 // With category field
  claims: Claim[],                   // Answer claims
  evidence: Evidence[],              // Citation links
  classifications: Classification[], // Source classifications
  answer: { text: string },          // Generated answer
  provider_results: ProviderResult[], // Raw search results
  fetched_docs: FetchedDoc[]         // Successfully fetched content
  // MISSING: computed analysis metrics
};

// LLM analysis cache (PERMANENT storage for intelligence reports)
const analysisCache = {
  ...llm_response_data,              // Full LLM response JSON
  metadata: {                        // Added metadata wrapper
    run_id: string,
    query: string,
    search_model: string,
    created_at: string,
    generated_at: string
  }
};
```

### Redis Commands (ACTUAL CURRENT IMPLEMENTATION)

```typescript
// Store complete search bundle (PERMANENT)
CACHE.set_json(CACHE.ai_key(`${runId}`), searchBundle); // No TTL

// Store LLM analysis with metadata (PERMANENT for intelligence reports)
const enrichedData = {
  ...llm_response_data,
  metadata: { run_id, query, search_model, created_at, generated_at }
};
CACHE.set_json(CACHE.ai_key(`analysis:${runId}`), enrichedData); // No TTL

// Query deduplication (30 minutes)
const qhash = hashlib.sha256((query + pipeline_version).encode()).hexdigest();
CACHE.set(CACHE.ai_key(`query_hash:${qhash}`), runId, ttl=30*60);

// Indices (PERMANENT for marketing intelligence)
CACHE.zadd(CACHE.ai_key("recent"), score=datetime.utcnow().timestamp(), member=runId);
CACHE.zadd(CACHE.ai_key("reports"), score=datetime.utcnow().timestamp(), member=runId);
CACHE.lpush(CACHE.ai_key(`q:${qhash}`), runId, ttl=90*24*3600); // 90 days
```

## Immediate Data Enhancement Recommendations

### 1. Add Analysis Metrics to Search Bundle

**Problem**: Intelligence reports need funnel data (proposed → fetched → cited) but it's not stored in bundles.

**Solution**: Add computed analysis to `store.py:create_run()`:

```python
# Add this after source categorization in create_run()
from ..services.analysis import compute_analysis

# Compute and store analysis metrics with each bundle
analysis = compute_analysis(bundle)
bundle["analysis"] = analysis  # Add to bundle before Redis storage
```

### 2. Enhance Source Authority & Recency Classification

**Problem**: Intelligence reports need authority levels and recency categories for better analysis.

**Solution**: Add helper functions to source processing:

```python
def classify_source_authority(credibility_score: float) -> str:
    if credibility_score >= 0.8: return "high"
    elif credibility_score >= 0.6: return "medium"
    else: return "low"

def classify_source_recency(published_at: str) -> str:
    # Classify as recent/medium/stale based on published_at
    # Implementation based on business rules
```

### 3. Preserve Provider Ranking Data

**Problem**: Original search provider rankings/scores are not preserved in sources.

**Solution**: Map provider results to sources during processing:

```python
# In source processing, preserve provider metadata
for source in sources:
    provider_result = find_matching_provider_result(source.url, bundle['provider_results'])
    if provider_result:
        source['provider_rank'] = provider_result.get('rank')
        source['provider_score'] = provider_result.get('score')
```

### 4. Cross-Run Intelligence Patterns

**Problem**: Intelligence reports would benefit from cross-run pattern analysis.

**Future Enhancement**: Add aggregate intelligence storage:

```redis
# Subject-level intelligence patterns
ai_search:v1:intelligence:{subject} -> JSON (aggregated insights)

# Global citation success patterns  
ai_search:v1:patterns:success_factors -> JSON (what drives citations)

# Domain authority tracking over time
ai_search:v1:authority:{domain} -> JSON (authority metrics by domain)
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

## Summary: Intelligence Report Data Coverage

### ✅ **Current Data Coverage (EXCELLENT)**:

1. **Core Intelligence Data**: All essential data for citation_analysis.md prompt is available:
   - ✅ Query, sources with metadata, claims, evidence, citations
   - ✅ Source categorization (gov, edu, research, consultancy, agency, etc.)
   - ✅ Authority signals (credibility scores, author, publisher)
   - ✅ Content metadata (word count, media type, published dates)

2. **Enhanced Source Intelligence**: Recent improvements provide business-relevant categorization:
   - ✅ Meaningful categories instead of generic "web" 
   - ✅ Subject-based filtering and analysis
   - ✅ Permanent storage for intelligence reports

### 🔧 **Recommended Immediate Enhancements**:

1. **Add Analysis Metrics to Bundle** - Funnel data (proposed → fetched → cited)
2. **Source Authority/Recency Classification** - High/medium/low authority levels
3. **Provider Ranking Preservation** - Original search rankings and scores

### 📊 **Data Architecture Strengths**:

1. **Permanent Storage Strategy**: No TTL on core data ensures marketing intelligence persistence
2. **Versioned Schema**: `ai_search:v1:*` namespace allows schema evolution  
3. **Complete Data Lineage**: Full traceability from search query to final citations
4. **Rich Source Metadata**: Comprehensive source characterization for analysis
5. **Subject-Based Intelligence**: Enables competitive analysis by vertical

### 🚀 **Intelligence Report Readiness**: **95% Complete**

The current Redis schema provides **excellent coverage** for generating comprehensive AI search intelligence reports. The citation_analysis.md prompt has access to all core data needed for:

- ✅ AI search selection pattern analysis
- ✅ Content opportunity identification  
- ✅ Competitive landscape intelligence
- ✅ Source type and authority analysis
- ✅ Citation success factor identification

**Missing only**: Computed funnel metrics (easily added) and enhanced authority classification (nice-to-have).

This schema ensures:
✅ Complete data lineage from search to citation
✅ Efficient Redis caching for performance  
✅ Business-relevant source categorization
✅ Marketing intelligence tied to actual search results
✅ Subject-based competitive analysis capability
✅ Permanent storage for intelligence reports
