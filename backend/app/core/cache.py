import os
import json
import time
import fnmatch
from typing import Optional, Any, List

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None


class Cache:
    def __init__(self) -> None:
        self.backend = os.getenv("CACHE_BACKEND", "memory").lower()
        self.ttl_default = int(os.getenv("CACHE_TTL_DEFAULT", "3600"))
        self._mem: dict[str, tuple[float, str]] = {}
        self._mem_sets: dict[str, set[str]] = {}
        self._mem_lists: dict[str, List[str]] = {}
        self._redis = None
        if self.backend == "redis" and redis is not None:
            url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            self._redis = redis.Redis.from_url(url)

    def get(self, key: str) -> Optional[str]:
        if self._redis is not None:
            val = self._redis.get(key)
            return val.decode("utf-8") if val else None
        item = self._mem.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at and expires_at < time.time():
            self._mem.pop(key, None)
            return None
        return value

    def set(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        # If no TTL specified, use default. If explicitly None passed, make it permanent.
        if ttl is None:
            ttl = self.ttl_default
        elif ttl == -1:  # Use -1 as sentinel for permanent storage
            ttl = None
            
        if self._redis is not None:
            if ttl is None:
                # Permanent storage - no TTL
                self._redis.set(key, value)
            else:
                # Temporary storage with TTL
                self._redis.setex(key, ttl, value)
            return
        
        # Memory backend
        if ttl is None:
            # Permanent storage - use sentinel for "no expiry"
            self._mem[key] = (float("inf"), value)
        else:
            # Temporary storage with TTL
            self._mem[key] = (time.time() + ttl, value)

    def get_json(self, key: str) -> Optional[Any]:
        val = self.get(key)
        return json.loads(val) if val else None

    def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        self.set(key, json.dumps(value), ttl)

    # Debug helpers
    def keys(self, pattern: str = "*") -> List[str]:
        if self._redis is not None:
            return [k.decode("utf-8") for k in self._redis.scan_iter(match=pattern, count=500)]
        # Memory backend: approximate glob match
        return [k for k in self._mem.keys() if fnmatch.fnmatch(k, pattern)]

    def ttl(self, key: str) -> Optional[int]:
        if self._redis is not None:
            try:
                return int(self._redis.ttl(key))
            except Exception:
                return None
        item = self._mem.get(key)
        if not item:
            return None
        expires_at, _ = item
        remaining = int(expires_at - time.time())
        return remaining

    def delete(self, key: str) -> None:
        if self._redis is not None:
            try:
                self._redis.delete(key)
            except Exception:
                pass
            return
        self._mem.pop(key, None)
        self._mem_lists.pop(key, None)
        self._mem_sets.pop(key, None)

    # Simple helpers for indices (Redis preferred; memory is best-effort)
    def zadd(self, key: str, score: float, member: str, ttl: Optional[int] = None) -> None:
        if self._redis is not None:
            self._redis.zadd(key, {member: score})
            if ttl:
                self._redis.expire(key, ttl)
            return
        # Memory fallback: use set and ignore score ordering
        s = self._mem_sets.setdefault(key, set())
        s.add(member)
        if ttl:
            # track ttl in _mem so keys() shows it until expiry
            self._mem[key] = (time.time() + ttl, "__zset__")

    def lpush(self, key: str, value: str, ttl: Optional[int] = None) -> None:
        if self._redis is not None:
            self._redis.lpush(key, value)
            if ttl:
                self._redis.expire(key, ttl)
            return
        lst = self._mem_lists.setdefault(key, [])
        lst.insert(0, value)
        if ttl:
            self._mem[key] = (time.time() + ttl, "__list__")

    def ltrim(self, key: str, max_len: int) -> None:
        if self._redis is not None:
            try:
                self._redis.ltrim(key, 0, max_len - 1)
            except Exception:
                pass
            return
        if key in self._mem_lists:
            self._mem_lists[key] = self._mem_lists[key][:max_len]

    def zrevrange_withscores(self, key: str, start: int, end: int) -> List[tuple[str, float]]:
        if self._redis is not None:
            try:
                items = self._redis.zrevrange(key, start, end, withscores=True)
                return [(m.decode("utf-8"), float(s)) for m, s in items]
            except Exception:
                return []
        # Memory fallback: unordered set with dummy score 0.0
        return [ (m, 0.0) for m in list(self._mem_sets.get(key, set()))[start:end+1] ]

    def lrange(self, key: str, start: int, end: int) -> List[str]:
        if self._redis is not None:
            try:
                items = self._redis.lrange(key, start, end)
                return [i.decode("utf-8") for i in items]
            except Exception:
                return []
        return self._mem_lists.get(key, [])[start:end+1]

    # Namespacing
    @staticmethod
    def ai_prefix() -> str:
        ver = os.getenv("PIPELINE_VERSION", "1").strip()
        return f"ai_search:v{ver}"

    @staticmethod
    def ai_key(suffix: str) -> str:
        return f"{Cache.ai_prefix()}:{suffix}"


CACHE = Cache()

