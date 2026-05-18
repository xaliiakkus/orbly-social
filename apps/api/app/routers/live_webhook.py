from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.config import settings
from app.services.live_replay import handle_egress_complete
from app.services.livekit_tokens import livekit_configured

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhook")
async def livekit_webhook(request: Request):
    if not livekit_configured():
        raise HTTPException(404, "Not found")

    body = await request.body()
    auth = request.headers.get("Authorization", "")

    try:
        from livekit.api import WebhookReceiver
        from livekit.protocol.egress import EgressStatus

        receiver = WebhookReceiver(settings.livekit_api_key, settings.livekit_api_secret)
        event = receiver.receive(body.decode("utf-8") if isinstance(body, bytes) else body, auth)
    except Exception as exc:
        logger.warning("LiveKit webhook rejected: %s", exc)
        raise HTTPException(401, "Invalid webhook") from exc

    event_name = getattr(event, "event", None) or ""
    if event_name in ("egress_ended", "egress_updated"):
        info = getattr(event, "egress_info", None) or getattr(event, "egressInfo", None)
        if info:
            egress_id = getattr(info, "egress_id", None) or getattr(info, "egressId", None)
            status = getattr(info, "status", None)
            if egress_id and status == EgressStatus.EGRESS_COMPLETE:
                room = getattr(info, "room_name", None) or getattr(info, "roomName", None)
                await handle_egress_complete(egress_id, room)

    return {"ok": True}
