from __future__ import annotations

import json
import logging
from typing import Any

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None
_available = False


async def connect_redis() -> None:
    global _client, _available
    if not settings.redis_enabled:
        return
    try:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
        await _client.ping()
        _available = True
        logger.info("Redis connected")
    except Exception as e:
        logger.warning("Redis unavailable: %s", e)
        _client = None
        _available = False


async def close_redis() -> None:
    global _client, _available
    if _client:
        await _client.aclose()
    _client = None
    _available = False


def redis_ok() -> bool:
    return _available and _client is not None


async def cache_get(key: str) -> str | None:
    if not redis_ok():
        return None
    return await _client.get(key)  # type: ignore[union-attr]


async def cache_set(key: str, value: str, ttl: int = 3600) -> None:
    if not redis_ok():
        return
    await _client.setex(key, ttl, value)  # type: ignore[union-attr]


async def cache_get_json(key: str) -> Any | None:
    raw = await cache_get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_set_json(key: str, value: Any, ttl: int = 3600) -> None:
    await cache_set(key, json.dumps(value), ttl)


async def feed_push(user_id: str, post_id: str, max_len: int = 500) -> None:
    if not redis_ok():
        return
    key = f"feed:{user_id}"
    await _client.lpush(key, post_id)  # type: ignore[union-attr]
    await _client.ltrim(key, 0, max_len - 1)  # type: ignore[union-attr]


async def feed_get(user_id: str, start: int = 0, end: int = 19) -> list[str]:
    if not redis_ok():
        return []
    key = f"feed:{user_id}"
    return await _client.lrange(key, start, end)  # type: ignore[union-attr]


async def trending_incr(tag: str, amount: float = 1.0) -> None:
    if not redis_ok():
        return
    await _client.zincrby("trending:hashtags", amount, tag.lower())  # type: ignore[union-attr]


async def trending_top(limit: int = 10) -> list[tuple[str, float]]:
    if not redis_ok():
        return []
    rows = await _client.zrevrange("trending:hashtags", 0, limit - 1, withscores=True)  # type: ignore[union-attr]
    return [(r[0], r[1]) for r in rows]
