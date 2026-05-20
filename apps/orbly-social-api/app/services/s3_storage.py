from __future__ import annotations

import uuid
from pathlib import Path

from app.config import settings


def is_configured() -> bool:
    return bool(settings.s3_endpoint and settings.s3_access_key_id and settings.s3_secret_access_key)


def _client():
    import boto3
    from botocore.config import Config

    if not is_configured():
        raise RuntimeError("S3 / iDrive e2 not configured")

    region = settings.s3_region if settings.s3_region != "auto" else None
    kwargs: dict = {
        "endpoint_url": settings.s3_endpoint,
        "aws_access_key_id": settings.s3_access_key_id,
        "aws_secret_access_key": settings.s3_secret_access_key,
        "config": Config(signature_version="s3v4"),
    }
    if region:
        kwargs["region_name"] = region
    return boto3.client("s3", **kwargs)


def _object_key(folder: str, filename: str) -> str:
    ext = Path(filename).suffix.lower() or ".bin"
    return f"{folder}/{uuid.uuid4().hex}{ext}"


def _public_url(key: str) -> str:
    if settings.s3_public_url:
        return f"{settings.s3_public_url.rstrip('/')}/{key}"
    base = settings.s3_endpoint.rstrip("/") if settings.s3_endpoint else ""
    bucket = settings.s3_bucket
    return f"{base}/{bucket}/{key}"


def create_presigned_upload(
    *,
    filename: str,
    content_type: str,
    folder: str = "media",
) -> dict:
    key = _object_key(folder, filename)
    client = _client()
    upload_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=600,
    )
    return {
        "uploadUrl": upload_url,
        "publicUrl": _public_url(key),
        "key": key,
        "method": "PUT",
        "idrive": True,
    }


def upload_bytes(
    data: bytes,
    *,
    filename: str,
    content_type: str,
    folder: str = "media",
) -> str:
    key = _object_key(folder, filename)
    client = _client()
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    return _public_url(key)
