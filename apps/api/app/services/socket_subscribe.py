from __future__ import annotations

from typing import Any

from beanie import PydanticObjectId

from app.models.conversation import Conversation
from app.models.live_channel import LiveChannel
from app.models.post import Post
from app.services.realtime import get_sid_user_id, sio


async def _can_join_room(user_id: str | None, room: str) -> bool:
    if not user_id:
        return room.startswith("post:")
    if room.startswith("live:"):
        channel_id = room[5:]
        if not channel_id:
            return False
        ch = await LiveChannel.find_one(
            LiveChannel.id == PydanticObjectId(channel_id),
            LiveChannel.status == "live",
        )
        return ch is not None
    if room.startswith("post:"):
        post_id = room[5:]
        if not post_id:
            return False
        post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
        return post is not None
    if room.startswith("convo:"):
        convo_id = room[6:]
        if not convo_id:
            return False
        convo = await Conversation.get(convo_id)
        return convo is not None and PydanticObjectId(user_id) in convo.participantIds
    if room.startswith("user:"):
        return room == f"user:{user_id}"
    return False


@sio.on("subscribe")
async def subscribe(sid: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    if not data or not isinstance(data, dict):
        return {"ok": False, "error": "Invalid payload"}
    rooms = data.get("rooms", [])
    if not isinstance(rooms, list):
        return {"ok": False, "error": "rooms must be a list"}
    user_id = get_sid_user_id(sid)
    joined: list[str] = []
    for room in rooms:
        if not isinstance(room, str) or not room:
            continue
        if await _can_join_room(user_id, room):
            await sio.enter_room(sid, room)
            joined.append(room)
    return {"ok": True, "joined": joined}


@sio.on("unsubscribe")
async def unsubscribe(sid: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    if not data or not isinstance(data, dict):
        return {"ok": False, "error": "Invalid payload"}
    rooms = data.get("rooms", [])
    if not isinstance(rooms, list):
        return {"ok": False, "error": "rooms must be a list"}
    for room in rooms:
        if isinstance(room, str) and room:
            await sio.leave_room(sid, room)
    return {"ok": True}
