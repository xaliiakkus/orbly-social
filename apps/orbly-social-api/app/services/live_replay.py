from __future__ import annotations

import logging
from datetime import datetime

from beanie import PydanticObjectId

from app.models.live_channel import LiveChannel
from app.models.post import Post
from app.services.livekit_egress import refresh_egress_for_channel, replay_public_url
from app.services.realtime import sio

logger = logging.getLogger(__name__)


async def apply_replay_url(ch: LiveChannel, replay_url: str) -> None:
    ch.replayUrl = replay_url
    ch.recordingStatus = "ready"
    await ch.save()

    if ch.replayPostId:
        await Post.find_one(Post.id == ch.replayPostId).update(
            {
                "$set": {
                    "mediaUrls": [replay_url],
                    "updatedAt": datetime.utcnow(),
                }
            }
        )

    room = f"live:{ch.id}"
    await sio.emit("channel:replay", {"channelId": str(ch.id), "replayUrl": replay_url}, room=room)
    await sio.emit("live:replay", {"channelId": str(ch.id), "replayUrl": replay_url})


async def try_finalize_egress(ch: LiveChannel) -> LiveChannel:
    """Poll egress once; set replay URL when recording is ready."""
    if not ch.egressId or ch.replayUrl:
        return ch
    if ch.recordingStatus not in ("recording", "processing"):
        return ch

    url, status = await refresh_egress_for_channel(str(ch.id), ch.egressId)
    ch.recordingStatus = status  # type: ignore[assignment]
    if url:
        await apply_replay_url(ch, url)
    elif status == "processing":
        await ch.save()
    elif status == "failed":
        ch.recordingStatus = "failed"
        await ch.save()
    return ch


async def channel_by_egress_id(egress_id: str) -> LiveChannel | None:
    return await LiveChannel.find_one(LiveChannel.egressId == egress_id)


async def handle_egress_complete(egress_id: str, room_name: str | None = None) -> None:
    ch = await channel_by_egress_id(egress_id)
    if not ch and room_name:
        ch = await LiveChannel.find_one(LiveChannel.livekitRoom == room_name)
    if not ch:
        logger.warning("No channel for egress %s", egress_id)
        return

    url, status = await refresh_egress_for_channel(str(ch.id), egress_id)
    if not url and status == "ready":
        url = replay_public_url(str(ch.id))
    if url:
        await apply_replay_url(ch, url)
    else:
        ch.recordingStatus = status  # type: ignore[assignment]
        await ch.save()
