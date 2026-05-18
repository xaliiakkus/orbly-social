from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import HTTPException

from app.config import settings

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


def _r2_configured() -> bool:
    return bool(
        settings.r2_endpoint
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
    )


def create_presigned_upload(
    *,
    filename: str,
    content_type: str,
    folder: str = "media",
) -> dict:
    ext = Path(filename).suffix.lower() or ".bin"
    key = f"{folder}/{uuid.uuid4().hex}{ext}"

    if _r2_configured():
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
        upload_url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.r2_bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=600,
        )
        public_url = (
            f"{settings.r2_public_url.rstrip('/')}/{key}"
            if settings.r2_public_url
            else upload_url.split("?")[0]
        )
        return {
            "uploadUrl": upload_url,
            "publicUrl": public_url,
            "key": key,
            "method": "PUT",
        }

    if settings.media_local_fallback:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        safe = key.replace("/", "_")
        base = settings.api_public_url.rstrip("/")
        public_url = f"{base}/uploads/{safe}"
        return {
            "uploadUrl": f"{base}/v1/media/upload-local?key={safe}",
            "publicUrl": public_url,
            "key": key,
            "method": "POST",
            "local": True,
        }

    raise HTTPException(503, "Media storage not configured")


async def save_local_upload(key: str, data: bytes, content_type: str) -> str:
    safe = key.replace("/", "_")
    path = UPLOAD_DIR / safe
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return f"/uploads/{safe}"
