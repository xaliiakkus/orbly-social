from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query

from app.deps import OptionalUserId
from app.models.live_channel import LiveChannel
from app.models.live_comment import LiveComment
from app.models.user import User
from app.services.livekit_tokens import livekit_configured
from app.commands.live_cmds import _channel_out
from app.services.serializers import user_out

router = APIRouter()


@router.get("/")
async def list_live(
    limit: int = Query(20, ge=1, le=50),
    viewer_id: OptionalUserId = None,
):
    channels = (
        await LiveChannel.find(LiveChannel.status == "live")
        .sort(-LiveChannel.startedAt)
        .limit(limit)
        .to_list()
    )
    host_ids = list({c.hostId for c in channels})
    hosts = await User.find({"_id": {"$in": host_ids}}).to_list() if host_ids else []
    hmap = {u.id: u for u in hosts}
    return {
        "configured": livekit_configured(),
        "data": [
            {
                "id": str(c.id),
                "title": c.title,
                "kind": c.kind,
                "mode": c.mode,
                "status": c.status,
                "listenerCount": c.listenerCount,
                "speakerCount": len(c.speakerIds) + 1,
                "startedAt": c.startedAt.isoformat() + "Z",
                "host": user_out(hmap[c.hostId]).model_dump(mode="json")
                if c.hostId in hmap
                else None,
            }
            for c in channels
        ],
    }


@router.get("/{channel_id}/stats")
async def live_stats(channel_id: str):
    ch = await LiveChannel.get(channel_id)
    if not ch:
        raise HTTPException(404, "Not found")
    host = await User.get(ch.hostId)
    from app.commands.live_cmds import _stats_out
    from app.services.live_replay import try_finalize_egress

    if ch.status == "ended" and ch.recordingStatus in ("recording", "processing"):
        ch = await try_finalize_egress(ch)

    return {"stats": await _stats_out(ch, host)}


@router.get("/{channel_id}/comments")
async def list_live_comments(
    channel_id: str,
    limit: int = Query(80, ge=1, le=200),
):
    ch = await LiveChannel.get(channel_id)
    if not ch:
        raise HTTPException(404, "Not found")
    comments = (
        await LiveComment.find(LiveComment.channelId == PydanticObjectId(channel_id))
        .sort(+LiveComment.createdAt)
        .limit(limit)
        .to_list()
    )
    user_ids = list({c.userId for c in comments})
    users = await User.find({"_id": {"$in": user_ids}}).to_list() if user_ids else []
    umap = {u.id: u for u in users}
    return {
        "data": [
            {
                "id": str(c.id),
                "channelId": str(c.channelId),
                "content": c.content,
                "createdAt": c.createdAt.isoformat() + "Z",
                "author": user_out(umap[c.userId]).model_dump(mode="json")
                if c.userId in umap
                else None,
            }
            for c in comments
        ],
    }


@router.get("/{channel_id}")
async def get_live(channel_id: str, viewer_id: OptionalUserId = None):
    ch = await LiveChannel.get(channel_id)
    if not ch:
        raise HTTPException(404, "Not found")
    host = await User.get(ch.hostId)
    channel = await _channel_out(ch, host, viewer_id=viewer_id)
    return {
        "configured": livekit_configured(),
        "channel": channel,
    }
