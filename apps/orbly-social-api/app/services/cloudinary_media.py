from __future__ import annotations

import io
import logging
import time
import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger(__name__)

_CONTENT_TYPE_BY_EXT: dict[str, str] = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
}


def normalize_content_type(filename: str, content_type: str) -> str:
    """Tarayıcıdan gelen boş veya application/octet-stream tiplerini düzelt."""
    ct = (content_type or "").split(";")[0].strip().lower()
    if ct and ct != "application/octet-stream":
        return ct
    ext = Path(filename).suffix.lower()
    return _CONTENT_TYPE_BY_EXT.get(ext, "image/jpeg")


def _ensure_config() -> None:
    if settings.cloudinary_url:
        cloudinary.config(cloudinary_url=settings.cloudinary_url, secure=True)
        return
    if (
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    ):
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )


def is_configured() -> bool:
    _ensure_config()
    return bool(cloudinary.config().cloud_name and cloudinary.config().api_secret)


def _require_config() -> None:
    if not is_configured():
        raise HTTPException(503, "Cloudinary not configured")


def _upload_endpoint(content_type: str) -> str:
    if content_type.startswith("video/"):
        return "video"
    if content_type.startswith("image/"):
        return "image"
    return "auto"


def create_signed_upload(
    *,
    filename: str,
    content_type: str,
    folder: str = "media",
) -> dict:
    """Tarayıcıdan doğrudan Cloudinary (opsiyonel; ana yol API UploadFile)."""
    _require_config()
    content_type = normalize_content_type(filename, content_type)
    cloud_name = cloudinary.config().cloud_name
    api_key = cloudinary.config().api_key
    api_secret = cloudinary.config().api_secret
    if not cloud_name or not api_key or not api_secret:
        raise HTTPException(503, "Cloudinary credentials incomplete")

    public_id = uuid.uuid4().hex
    folder_path = f"orbly/{folder}"
    timestamp = int(time.time())
    resource_type = "video" if content_type.startswith("video/") else "image"
    params_to_sign: dict[str, str | int] = {
        "timestamp": timestamp,
        "folder": folder_path,
        "public_id": public_id,
        "resource_type": resource_type,
    }
    signature = cloudinary.utils.api_sign_request(params_to_sign, api_secret)
    endpoint = _upload_endpoint(content_type)

    return {
        "uploadUrl": f"https://api.cloudinary.com/v1_1/{cloud_name}/{endpoint}/upload",
        "publicUrl": "",
        "key": f"{folder_path}/{public_id}",
        "method": "POST",
        "cloudinary": True,
        "fields": {
            "api_key": api_key,
            "timestamp": str(timestamp),
            "signature": signature,
            "folder": folder_path,
            "public_id": public_id,
            "resource_type": resource_type,
        },
    }


def upload_bytes(
    data: bytes,
    *,
    filename: str,
    content_type: str,
    folder: str = "media",
) -> str:
    """Sunucu yüklemesi — pycloudinary + BytesIO ([Python SDK](https://cloudinary.com/documentation/django_integration))."""
    _require_config()
    content_type = normalize_content_type(filename, content_type)
    resource_type = "video" if content_type.startswith("video/") else "image"
    public_id = uuid.uuid4().hex

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(data),
            folder=f"orbly/{folder}",
            public_id=public_id,
            resource_type=resource_type,
            overwrite=False,
        )
    except Exception as exc:
        logger.exception("Cloudinary upload failed")
        raise RuntimeError(f"Cloudinary upload failed: {exc}") from exc

    url = result.get("secure_url") or result.get("url")
    if not url:
        raise RuntimeError("Cloudinary upload returned no URL")
    return url
