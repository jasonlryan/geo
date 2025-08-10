# Canonical Prompt Management

## Overview

All prompts for the AI Search Intelligence platform are stored as canonical files in `/Users/jasonryan/Documents/geo/backend/prompts/` and should **NEVER** be hardcoded in Python files.

## Prompt File Structure

### Core Prompt Files
```
backend/prompts/
├── citation_analysis.md     # Intelligence report generation
├── random_query.md         # Subject-specific random query generation  
└── subjects.json          # Subject definitions and contexts
```

### Template System
Prompts use template placeholders that get substituted at runtime:
- `{SUBJECT_CONTEXT}` - Subject-specific keywords and topics
- `{SUBJECT}` - Subject name for context

## Random Query System (Fixed Implementation)

### 1. Canonical Prompt (`random_query.md`)
```markdown
SYSTEM
Generate a single, specific question about {SUBJECT_CONTEXT}. 
Focus on topics where firms like Korn Ferry, Russell Reynolds, Spencer Stuart, 
or similar consulting/search firms would have expertise.

Generate one random query that would be valuable for understanding 
AI search citation patterns in the {SUBJECT} domain.
```

### 2. Subject Definitions (`subjects.json`)
```json
{
  "Technology Leadership": {
    "context": "technology leadership, CTO hiring, digital transformation, tech talent acquisition, and engineering management",
    "description": "Technology executive search and digital leadership"
  },
  "Healthcare Executive": {
    "context": "healthcare leadership, hospital administration, medical executive search, healthcare governance, and clinical management", 
    "description": "Healthcare executive search and medical leadership"
  }
}
```

### 3. Runtime Template Substitution (`search.py`)
```python
# Load canonical prompt and subject data
system_prompt = load_random_query_prompt()  # From random_query.md
subject_data = get_subject_context(subject)   # From subjects.json

# Template substitution
subject_context = subject_data.get("context")
dynamic_prompt = system_prompt.replace("{SUBJECT_CONTEXT}", subject_context)
dynamic_prompt = dynamic_prompt.replace("{SUBJECT}", subject)
```

## Citation Analysis System

### Canonical Prompt (`citation_analysis.md`)
```markdown
SYSTEM
You are an AI search visibility analyst...

INPUT
- query: {query}
- subject: {subject}
- search_model: {search_model}
- sources: [enhanced source data with categories, authority, etc.]
```

**Key Enhancement**: The prompt now receives rich business context:
- Subject-specific analysis context
- Source categorization (gov, edu, consultancy, agency, etc.)
- Authority levels and credibility signals

## Benefits of Canonical Prompt Management

### ✅ **Maintainability**
- Single source of truth for all prompts
- Version control for prompt changes
- No code changes needed for prompt updates

### ✅ **Consistency**  
- All AI interactions use same canonical prompts
- Template system ensures consistent substitution
- No hardcoded prompt fragments

### ✅ **Flexibility**
- Easy to add new subjects via `subjects.json`
- Template placeholders allow dynamic content
- Prompts can be updated independently of code

### ✅ **Auditability**
- All prompts visible in version control
- Clear separation of code vs AI instructions
- Easy to track prompt performance over time

## Adding New Subjects

### 1. Update `subjects.json`
```json
{
  "New Subject Area": {
    "context": "relevant keywords, topics, and focus areas",
    "description": "Brief description of the subject domain"
  }
}
```

### 2. Test Random Query Generation
```bash
curl "http://localhost:8000/api/search/random-query?subject=New%20Subject%20Area"
```

### 3. Verify Subject-Specific Intelligence
- Run searches with the new subject
- Generate intelligence reports
- Confirm subject-specific competitive analysis

## Quality Assurance

### Prompt Testing
1. **Template Substitution**: Verify all `{PLACEHOLDER}` values are replaced
2. **Subject Specificity**: Ensure generated content matches subject domain
3. **Consistency**: Test multiple generations for quality and relevance

### Integration Testing
1. **Search Pipeline**: Verify subject flows through entire pipeline
2. **Intelligence Reports**: Confirm subject context enhances report quality
3. **Insights Dashboard**: Test subject-based filtering and analysis

## Migration Complete

### ✅ **Before** (Hardcoded):
```python
# BAD: Hardcoded in search.py
subject_contexts = {
    "Technology Leadership": "technology leadership, CTO hiring...",
    # More hardcoded contexts...
}
```

### ✅ **After** (Canonical):
```python
# GOOD: Loaded from canonical files
def get_subject_context(subject: str) -> dict:
    subjects = load_subject_contexts()  # From subjects.json
    return subjects.get(subject, default)
```

This canonical approach ensures all AI prompts are properly managed, version-controlled, and maintainable outside of code.