from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from app.errors import AppError

Handler = Callable[[str | None, dict[str, Any]], Awaitable[Any]]

_REGISTRY: dict[str, Handler] = {}
_PUBLIC: set[str] = set()


def action(name: str, *, public: bool = False) -> Callable[[Handler], Handler]:
    def decorator(fn: Handler) -> Handler:
        _REGISTRY[name] = fn
        if public:
            _PUBLIC.add(name)
        return fn

    return decorator


def is_public(name: str) -> bool:
    return name in _PUBLIC


async def dispatch(name: str, user_id: str | None, data: dict[str, Any]) -> Any:
    handler = _REGISTRY.get(name)
    if not handler:
        raise AppError(f"Unknown action: {name}", 404)
    if not is_public(name) and not user_id:
        raise AppError("Unauthorized", 401)
    return await handler(user_id, data)
