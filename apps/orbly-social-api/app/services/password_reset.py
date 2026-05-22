from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

RESET_TOKEN_BYTES = 32
RESET_EXPIRES_HOURS = 1


def new_reset_token() -> str:
    return secrets.token_urlsafe(RESET_TOKEN_BYTES)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def reset_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(hours=RESET_EXPIRES_HOURS)


def is_reset_expired(expires_at: datetime | None) -> bool:
    if expires_at is None:
        return True
    now = datetime.now(UTC)
    exp = expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=UTC)
    return now >= exp
