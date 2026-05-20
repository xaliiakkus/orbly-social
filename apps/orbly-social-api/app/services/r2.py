from __future__ import annotations

from pathlib import Path

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


async def save_local_upload(key: str, data: bytes, content_type: str) -> str:
    safe = key.replace("/", "_")
    path = UPLOAD_DIR / safe
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return f"/uploads/{safe}"


def create_presigned_upload(*args, **kwargs):
    from app.services.media_storage import create_presigned_upload as _create

    return _create(*args, **kwargs)
