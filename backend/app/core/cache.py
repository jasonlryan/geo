import os
import json
import time
from typing import Optional, Callable, Any

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None


class Cache:
    def __init__(self) -> None:
        self.backend = os.getenv("CACHE_BACKEND", "memory").lower()
        self.ttl_default = int(os.getenv("CACHE_TTL_DEFAULT", "3600"))
        self._mem: dict[str, tuple[float, str]] = {}
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
        ttl = ttl or self.ttl_default
        if self._redis is not None:
            self._redis.setex(key, ttl, value)
            return
        self._mem[key] = (time.time() + ttl, value)

    def get_json(self, key: str) -> Optional[Any]:
        val = self.get(key)
        return json.loads(val) if val else None

    def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        self.set(key, json.dumps(value), ttl)


CACHE = Cache()

