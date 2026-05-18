import base64
from datetime import datetime

from beanie import PydanticObjectId

DEFAULT_LIMIT = 20
MAX_LIMIT = 50


def parse_limit(raw: int | None = None) -> int:
    if raw is None:
        return DEFAULT_LIMIT
    return max(1, min(raw, MAX_LIMIT))


def encode_cursor(created_at: datetime, doc_id: PydanticObjectId) -> str:
    raw = f"{created_at.isoformat()}|{doc_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[datetime, PydanticObjectId] | None:
    try:
        pad = "=" * (-len(cursor) % 4)
        decoded = base64.urlsafe_b64decode(cursor + pad).decode()
        iso, oid = decoded.split("|", 1)
        return datetime.fromisoformat(iso), PydanticObjectId(oid)
    except Exception:
        return None
