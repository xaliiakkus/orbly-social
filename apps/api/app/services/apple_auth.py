import time
from typing import Any

import httpx
from jose import jwk, jwt
from jose.exceptions import JWTError

from app.config import settings

APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"

_keys_cache: dict[str, Any] | None = None
_keys_fetched_at = 0.0


async def _get_apple_keys() -> dict[str, Any]:
    global _keys_cache, _keys_fetched_at
    if _keys_cache and time.time() - _keys_fetched_at < 3600:
        return _keys_cache
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(APPLE_KEYS_URL)
        res.raise_for_status()
        _keys_cache = res.json()
        _keys_fetched_at = time.time()
        return _keys_cache


async def verify_apple_id_token(id_token: str) -> dict[str, Any]:
    if not settings.apple_client_id:
        raise ValueError("APPLE_CLIENT_ID not configured")

    keys = await _get_apple_keys()
    header = jwt.get_unverified_header(id_token)
    kid = header.get("kid")
    if not kid:
        raise ValueError("Missing key id in Apple token")

    key_data = next((k for k in keys.get("keys", []) if k.get("kid") == kid), None)
    if not key_data:
        raise ValueError("Apple public key not found")

    try:
        public_key = jwk.construct(key_data)
        return jwt.decode(
            id_token,
            public_key,
            algorithms=[header.get("alg", "RS256")],
            audience=settings.apple_client_id,
            issuer=APPLE_ISSUER,
            options={"verify_at_hash": False},
        )
    except JWTError as exc:
        raise ValueError("Invalid Apple identity token") from exc
