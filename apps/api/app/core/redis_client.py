import redis.asyncio as redis
from app.core.config import settings
import json
import hashlib
import logging

logger = logging.getLogger("agentforge.redis")
_redis_client = None
_redis_available = True

# Simple in-memory fallback cache
_local_cache = {}

async def get_redis():
    global _redis_client, _redis_available
    if not _redis_available:
        return None
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=3,
                retry_on_timeout=True,
            )
            # Ping to verify connection
            await _redis_client.ping()
            _redis_available = True
        except Exception as e:
            logger.warning(f"Redis is unavailable at {settings.REDIS_URL} (error: {e}). Falling back to in-memory storage.")
            _redis_available = False
            _redis_client = None
    return _redis_client

async def cache_get(key: str):
    r = await get_redis()
    if r:
        try:
            val = await r.get(key)
            return json.loads(val) if val else None
        except Exception as e:
            logger.error(f"Redis get error for {key}: {e}")
            return None
    return _local_cache.get(key)

async def cache_set(key: str, value: dict, ttl: int = 86400):
    r = await get_redis()
    if r:
        try:
            await r.setex(key, ttl, json.dumps(value))
            return
        except Exception as e:
            logger.error(f"Redis set error for {key}: {e}")
    # Local fallback
    _local_cache[key] = value

def make_cache_key(prefix: str, prompt: str) -> str:
    digest = hashlib.sha256(prompt.strip().lower().encode()).hexdigest()[:16]
    return f"{prefix}:{digest}"
