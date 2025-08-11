import os
import json
from typing import Optional, Any, List
from dotenv import load_dotenv

# Load environment variables before importing anything else
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None


class Cache:
    def __init__(self) -> None:
        self.ttl_default = int(os.getenv("CACHE_TTL_DEFAULT", "3600"))
        if redis is None:
            raise RuntimeError("Redis library not available")
        
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._redis = redis.Redis.from_url(url)
        
        # Test Redis connection
        try:
            self._redis.ping()
        except Exception as e:
            raise RuntimeError(f"Redis connection failed: {e}")

    def get(self, key: str) -> Optional[str]:
        val = self._redis.get(key)
        return val.decode("utf-8") if val else None

    def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        # If no TTL specified, use default. If explicitly None passed, make it permanent.
        if ttl is None:
            ttl = self.ttl_default
        elif ttl == -1:  # Use -1 as sentinel for permanent storage
            ttl = None
            
        if ttl is None:
            # Permanent storage - no TTL
            self._redis.set(key, value)
        else:
            # Temporary storage with TTL
            self._redis.setex(key, ttl, value)

    def get_json(self, key: str) -> Optional[Any]:
        val = self.get(key)
        return json.loads(val) if val else None

    def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        self.set(key, json.dumps(value), ttl)

    # Debug helpers
    def keys(self, pattern: str = "*") -> List[str]:
        return [k.decode("utf-8") for k in self._redis.scan_iter(match=pattern, count=500)]

    def ttl(self, key: str) -> Optional[int]:
        try:
            return int(self._redis.ttl(key))
        except Exception:
            return None

    def delete(self, key: str) -> None:
        try:
            self._redis.delete(key)
        except Exception:
            pass

    # Redis-only sorted set operations
    def zadd(self, key: str, score: float, member: str, ttl: Optional[int] = None) -> None:
        self._redis.zadd(key, {member: score})
        if ttl:
            self._redis.expire(key, ttl)

    def lpush(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        self._redis.lpush(key, value)
        if ttl:
            self._redis.expire(key, ttl)

    def ltrim(self, key: str, max_len: int) -> None:
        try:
            self._redis.ltrim(key, 0, max_len - 1)
        except Exception:
            pass

    def zrevrange_withscores(self, key: str, start: int, end: int) -> List[tuple[str, float]]:
        try:
            items = self._redis.zrevrange(key, start, end, withscores=True)
            return [(m.decode("utf-8"), float(s)) for m, s in items]
        except Exception:
            return []

    def lrange(self, key: str, start: int, end: int) -> List[str]:
        try:
            items = self._redis.lrange(key, start, end)
            return [i.decode("utf-8") for i in items]
        except Exception:
            return []

    # Namespacing
    @staticmethod
    def ai_prefix() -> str:
        ver = os.getenv("PIPELINE_VERSION", "1").strip()
        return f"ai_search:v{ver}"

    @staticmethod
    def ai_key(suffix: str) -> str:
        return f"{Cache.ai_prefix()}:{suffix}"


CACHE = Cache()

