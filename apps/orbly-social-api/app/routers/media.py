from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.commands.media_cmds import presign as presign_cmd
from app.deps import UserId
from app.schemas.media import PresignIn
from app.services.cloudinary_media import is_configured as cloudinary_configured
from app.services.cloudinary_media import upload_bytes as cloudinary_upload_bytes
from app.services.r2 import save_local_upload
from app.services.tenor import search_gifs

_MAX_IMAGE_BYTES = 10 * 1024 * 1024
_MAX_VIDEO_BYTES = 100 * 1024 * 1024
_ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/webm",
}

router = APIRouter()


@router.post("/presign")
async def presign(_user_id: UserId, body: PresignIn):
    """REST fallback when socket RPC is unavailable."""
    return await presign_cmd(_user_id, body.model_dump())


@router.get("/gifs")
async def gifs(
    _user_id: UserId,
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=20, ge=1, le=30),
):
    from app.config import settings

    if not settings.tenor_api_key:
        raise HTTPException(503, "GIF search is not configured (set TENOR_API_KEY)")
    try:
        data = await search_gifs(q, limit=limit)
    except Exception as exc:
        raise HTTPException(502, "GIF provider error") from exc
    return {"data": data}


@router.post("/upload")
async def upload_media(
    _user_id: UserId,
    file: UploadFile = File(...),
    folder: str = Query(default="media", max_length=50),
):
    """Sunucu üzerinden Cloudinary yükleme (imzalı istemci yüklemesi alternatifi)."""
    if not cloudinary_configured():
        raise HTTPException(503, "Cloudinary not configured")
    ct = file.content_type or "application/octet-stream"
    if ct not in _ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported type: {ct}")
    data = await file.read()
    limit = _MAX_VIDEO_BYTES if ct.startswith("video/") else _MAX_IMAGE_BYTES
    if len(data) > limit:
        raise HTTPException(400, f"Max {limit // (1024 * 1024)}MB for this file type")
    name = file.filename or "upload.bin"
    url = cloudinary_upload_bytes(data, filename=name, content_type=ct, folder=folder)
    return {"publicUrl": url}


@router.post("/upload-local")
async def upload_local(
    _user_id: UserId,
    key: str = Query(..., min_length=1, max_length=500),
    file: UploadFile = File(...),
):
    """Multipart upload fallback when object storage is not configured."""
    data = await file.read()
    ct = file.content_type or "application/octet-stream"
    if ct not in _ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported type: {ct}")
    limit = _MAX_VIDEO_BYTES if ct.startswith("video/") else 5 * 1024 * 1024
    if len(data) > limit:
        raise HTTPException(400, f"Max {limit // (1024 * 1024)}MB per file")
    url = await save_local_upload(key, data, ct)
    return {"publicUrl": url}
