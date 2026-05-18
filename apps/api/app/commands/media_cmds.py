from __future__ import annotations

from typing import Any

from app.commands.registry import action
from app.schemas.media import PresignIn
from app.services.r2 import create_presigned_upload


@action("media.presign")
async def presign(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = PresignIn.model_validate(data)
    return create_presigned_upload(
        filename=body.filename,
        content_type=body.contentType,
        folder=body.folder,
    )
