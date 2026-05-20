from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Literal

from fastapi import HTTPException

from app.config import settings
from app.services import cloudinary_media, s3_storage
from app.services.r2 import UPLOAD_DIR, save_local_upload

logger = logging.getLogger(__name__)

StoragePreference = Literal["auto", "cloudinary", "idrive"]


def _is_video(content_type: str) -> bool:
    return content_type.startswith("video/")


def _is_image(content_type: str) -> bool:
    return content_type.startswith("image/")


def storage_status() -> dict[str, bool]:
    return {
        "cloudinary": cloudinary_media.is_configured(),
        "idrive": s3_storage.is_configured(),
        "local": settings.media_local_fallback,
    }


def create_presigned_upload(
    *,
    filename: str,
    content_type: str,
    folder: str = "media",
    storage: StoragePreference = "auto",
) -> dict:
    content_type = cloudinary_media.normalize_content_type(filename, content_type)
    has_cdn = cloudinary_media.is_configured()
    has_s3 = s3_storage.is_configured()

    if storage == "idrive":
        if not has_s3:
            raise HTTPException(503, "iDrive e2 not configured")
        out = s3_storage.create_presigned_upload(
            filename=filename,
            content_type=content_type,
            folder=folder,
        )
        out["storage"] = "idrive"
        return out

    if storage == "cloudinary":
        if not has_cdn:
            raise HTTPException(503, "Cloudinary not configured")
        out = cloudinary_media.create_signed_upload(
            filename=filename,
            content_type=content_type,
            folder=folder,
        )
        out["storage"] = "cloudinary"
        return out

    prefer_idrive_images = (
        settings.media_prefer_idrive_for_images and has_s3 and _is_image(content_type)
    )

    if has_s3 and (_is_video(content_type) or prefer_idrive_images):
        out = s3_storage.create_presigned_upload(
            filename=filename,
            content_type=content_type,
            folder=folder,
        )
        out["storage"] = "idrive"
        return out

    if has_cdn and _is_image(content_type):
        out = cloudinary_media.create_signed_upload(
            filename=filename,
            content_type=content_type,
            folder=folder,
        )
        out["storage"] = "cloudinary"
        return out

    if has_cdn:
        out = cloudinary_media.create_signed_upload(
            filename=filename,
            content_type=content_type,
            folder=folder,
        )
        out["storage"] = "cloudinary"
        return out

    if has_s3:
        out = s3_storage.create_presigned_upload(
            filename=filename,
            content_type=content_type,
            folder=folder,
        )
        out["storage"] = "idrive"
        return out

    if settings.media_local_fallback:
        ext = Path(filename).suffix.lower() or ".bin"
        key = f"{folder}/{uuid.uuid4().hex}{ext}"
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        safe = key.replace("/", "_")
        base = settings.api_public_url.rstrip("/")
        return {
            "uploadUrl": f"{base}/v1/media/upload-local?key={safe}",
            "publicUrl": f"{base}/uploads/{safe}",
            "key": key,
            "method": "POST",
            "local": True,
            "storage": "local",
        }

    raise HTTPException(503, "Media storage not configured")


async def upload_bytes(
    data: bytes,
    *,
    filename: str,
    content_type: str,
    folder: str = "media",
    storage: StoragePreference = "auto",
) -> dict[str, str]:
    content_type = cloudinary_media.normalize_content_type(filename, content_type)
    has_cdn = cloudinary_media.is_configured()
    has_s3 = s3_storage.is_configured()

    if storage == "idrive":
        if not has_s3:
            raise HTTPException(503, "iDrive e2 not configured")
        url = s3_storage.upload_bytes(
            data, filename=filename, content_type=content_type, folder=folder
        )
        return {"publicUrl": url, "archiveUrl": "", "storage": "idrive"}

    if storage == "cloudinary":
        if not has_cdn:
            raise HTTPException(503, "Cloudinary not configured")
        url = cloudinary_media.upload_bytes(
            data, filename=filename, content_type=content_type, folder=folder
        )
        return {"publicUrl": url, "archiveUrl": "", "storage": "cloudinary"}

    # auto: video → iDrive; image → Cloudinary (hızlı), iDrive yalnızca yedek
    if _is_video(content_type) and has_s3:
        url = s3_storage.upload_bytes(
            data, filename=filename, content_type=content_type, folder=folder
        )
        return {"publicUrl": url, "archiveUrl": "", "storage": "idrive"}

    if has_cdn and _is_image(content_type):
        try:
            url = cloudinary_media.upload_bytes(
                data, filename=filename, content_type=content_type, folder=folder
            )
            return {"publicUrl": url, "archiveUrl": "", "storage": "cloudinary"}
        except Exception as exc:
            logger.warning("Cloudinary upload failed, trying iDrive: %s", exc)
            if not has_s3:
                raise HTTPException(502, "Media upload failed") from exc

    if has_s3:
        url = s3_storage.upload_bytes(
            data, filename=filename, content_type=content_type, folder=folder
        )
        return {"publicUrl": url, "archiveUrl": "", "storage": "idrive"}

    if has_cdn:
        url = cloudinary_media.upload_bytes(
            data, filename=filename, content_type=content_type, folder=folder
        )
        return {"publicUrl": url, "archiveUrl": "", "storage": "cloudinary"}

    if settings.media_local_fallback:
        ext = Path(filename).suffix.lower() or ".bin"
        key = f"{folder}/{uuid.uuid4().hex}{ext}"
        url = await save_local_upload(key.replace("/", "_"), data, content_type)
        base = settings.api_public_url.rstrip("/")
        public = url if url.startswith("http") else f"{base}{url}"
        return {"publicUrl": public, "archiveUrl": "", "storage": "local"}

    raise HTTPException(503, "Media storage not configured")
