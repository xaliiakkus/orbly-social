from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from app.deps import UserId
from app.services.r2 import create_presigned_upload, save_local_upload
from app.services.tenor import search_gifs

router = APIRouter()


class PresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    contentType: str = Field(min_length=3, max_length=100)
    folder: str = Field(default="media", max_length=50)


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


@router.post("/presign")
async def presign(body: PresignIn, _user_id: UserId):
    return create_presigned_upload(
        filename=body.filename,
        content_type=body.contentType,
        folder=body.folder,
    )


@router.post("/upload-local")
async def upload_local(
    _user_id: UserId,
    key: str = Query(..., min_length=1, max_length=500),
    file: UploadFile = File(...),
):
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Max 5MB per file")
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"}
    ct = file.content_type or "application/octet-stream"
    if ct not in allowed:
        raise HTTPException(400, f"Unsupported type: {ct}")
    url = await save_local_upload(key, data, ct)
    return {"publicUrl": url}
