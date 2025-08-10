# Redis Utilities - Canonical Version

This directory contains the **single canonical Redis utility** for the AI Search Marketing Intelligence platform.

## Files

- `redis_utils.py` - **The only Redis utility you need**
- `README.md` - This documentation

## Usage

All Redis operations should use the canonical utility:

```bash
# Check Redis status
python3 backend/app/redis/redis_utils.py status

# List all search runs  
python3 backend/app/redis/redis_utils.py runs

# List intelligence reports
python3 backend/app/redis/redis_utils.py reports

# Show aggregate statistics
python3 backend/app/redis/redis_utils.py stats

# Clean up expired keys
python3 backend/app/redis/redis_utils.py cleanup
```

## Integration

The utility uses the same Redis connection as the backend:
- Uses `app.core.cache.CACHE` for all operations
- Respects environment configuration (`.env`)
- Uses versioned keys (`ai_search:v1:*`)

## Data Structure

The platform stores:
- **Search bundles**: `ai_search:v1:{run_id}` (permanent)
- **Intelligence reports**: `ai_search:v1:analysis:{run_id}` (permanent) 
- **Recent index**: `ai_search:v1:recent` (permanent)
- **Reports index**: `ai_search:v1:reports` (permanent)
- **Query history**: `ai_search:v1:q:{hash}` (90 days)
- **Dedup hashes**: `ai_search:v1:query_hash:{hash}` (30 minutes)

## No More Duplicates

This is the **only** Redis utility. All other Redis scripts have been removed to avoid:
- ❌ Connection inconsistencies  
- ❌ Different Redis instances
- ❌ Duplicate code
- ❌ Data access conflicts

## Development

If you need Redis operations, extend `RedisUtils` class in `redis_utils.py` instead of creating new scripts.