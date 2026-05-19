from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.commands.media_cmds import presign as presign_cmd
from app.deps import UserId
from app.schemas.media import PresignIn
from app.services.r2 import save_local_upload
from app.services.tenor import search_gifs

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


@router.post("/upload-local")
async def upload_local(
    _user_id: UserId,
    key: str = Query(..., min_length=1, max_length=500),
    file: UploadFile = File(...),
):
    """Multipart upload fallback when object storage is not configured."""
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Max 5MB per file")
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"}
    ct = file.content_type or "application/octet-stream"
    if ct not in allowed:
        raise HTTPException(400, f"Unsupported type: {ct}")
    url = await save_local_upload(key, data, ct)
    return {"publicUrl": url}
