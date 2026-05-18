from __future__ import annotations

import logging
from typing import Any

from app.config import settings
from app.services.livekit_tokens import livekit_configured

logger = logging.getLogger(__name__)


def egress_storage_configured() -> bool:
    return bool(
        livekit_configured()
        and settings.r2_endpoint
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
        and settings.r2_bucket
        and settings.r2_public_url
    )


def _api_host() -> str:
    url = settings.livekit_url.rstrip("/")
    if url.startswith("wss://"):
        return url.replace("wss://", "https://", 1)
    if url.startswith("ws://"):
        return url.replace("ws://", "http://", 1)
    return url


def _livekit_api():
    from livekit.api import LiveKitAPI

    return LiveKitAPI(
        _api_host(),
        settings.livekit_api_key,
        settings.livekit_api_secret,
    )


def replay_public_url(channel_id: str) -> str:
    return f"{settings.r2_public_url.rstrip('/')}/live-replays/{channel_id}.mp4"


async def start_room_recording(*, room_name: str, channel_id: str) -> str | None:
    """Start room composite MP4 egress to R2. Returns egress_id or None if skipped."""
    if not egress_storage_configured():
        return None

    try:
        from livekit.protocol.egress import (
            EncodedFileOutput,
            EncodedFileType,
            RoomCompositeEgressRequest,
            S3Upload,
        )

        s3 = S3Upload(
            access_key=settings.r2_access_key_id,
            secret=settings.r2_secret_access_key,
            region="auto",
            bucket=settings.r2_bucket,
            endpoint=settings.r2_endpoint,
        )
        file_output = EncodedFileOutput(
            file_type=EncodedFileType.MP4,
            filepath=f"live-replays/{channel_id}.mp4",
            s3=s3,
        )
        req = RoomCompositeEgressRequest(
            room_name=room_name,
            audio_only=False,
            file_outputs=[file_output],
        )
        api = _livekit_api()
        info = await api.egress.start_room_composite_egress(req)
        return info.egress_id
    except Exception:
        logger.exception("Failed to start egress for room %s", room_name)
        return None


async def stop_room_recording(egress_id: str | None) -> None:
    if not egress_id or not livekit_configured():
        return
    try:
        from livekit.protocol.egress import StopEgressRequest

        api = _livekit_api()
        await api.egress.stop_egress(StopEgressRequest(egress_id=egress_id))
    except Exception:
        logger.exception("Failed to stop egress %s", egress_id)


def _file_url_from_egress_info(info: Any) -> str | None:
    """Extract public replay URL from EgressInfo protobuf."""
    try:
        if info.file_results:
            for fr in info.file_results:
                loc = getattr(fr, "location", None) or getattr(fr, "download_url", None)
                if loc and str(loc).startswith("http"):
                    return str(loc)
        if info.file_outputs:
            for fo in info.file_outputs:
                loc = getattr(fo, "location", None)
                if loc and str(loc).startswith("http"):
                    return str(loc)
    except Exception:
        pass
    channel_id = getattr(info, "room_id", None) or getattr(info, "room_name", None)
    if channel_id and egress_storage_configured():
        # Fallback: predictable R2 public path
        cid = str(channel_id).replace("orbly-", "")
        if len(cid) == 12:
            pass
    return None


async def refresh_egress_for_channel(channel_id: str, egress_id: str) -> tuple[str | None, str]:
    """
    Poll egress status. Returns (replay_url, recording_status).
    recording_status: processing | ready | failed
    """
    if not egress_id or not livekit_configured():
        return None, "failed"

    try:
        from livekit.protocol.egress import EgressStatus, ListEgressRequest

        api = _livekit_api()
        listed = await api.egress.list_egress(ListEgressRequest(egress_id=egress_id))
        items = list(getattr(listed, "items", None) or [])
        if not items:
            return None, "processing"

        info = items[0]
        status = info.status
        if status == EgressStatus.EGRESS_COMPLETE:
            url = _file_url_from_egress_info(info) or replay_public_url(channel_id)
            return url, "ready"
        if status in (EgressStatus.EGRESS_FAILED, EgressStatus.EGRESS_ABORTED):
            return None, "failed"
        return None, "processing"
    except Exception:
        logger.exception("Egress poll failed for %s", egress_id)
        return None, "processing"
