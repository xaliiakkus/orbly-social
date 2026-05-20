from __future__ import annotations

from datetime import datetime
from typing import Any

from beanie import PydanticObjectId

from app.commands.registry import action
from app.errors import AppError
from app.models.conversation import Conversation, LastMessage
from app.models.message import Message
from app.models.user import User
from app.services.serializers import user_out
from app.schemas.conversations import CreateConversationIn, SendMessageIn
from app.services.follow_checks import require_mutual_follow_for_dm
from app.services.realtime import emit_message
from app.services.realtime_broadcast import broadcast_conversation_message
from app.utils import resolve_user_by_id_or_username


@action("conversations.create")
async def create_conversation(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = CreateConversationIn.model_validate(data)
    target = await resolve_user_by_id_or_username(body.participantId)
    if not target:
        raise AppError("User not found", 404)
    target_id = str(target.id)
    if target_id == user_id:
        raise AppError("Invalid participant", 400)
    await require_mutual_follow_for_dm(user_id, target_id)
    ids = sorted([user_id, target_id])
    oids = [PydanticObjectId(ids[0]), PydanticObjectId(ids[1])]
    convo = await Conversation.find_one({"participantIds": {"$all": oids, "$size": 2}})
    if not convo:
        convo = Conversation(participantIds=oids, unreadCounts={})
        await convo.insert()
    return {"conversationId": str(convo.id)}


@action("conversations.delete")
async def delete_conversation(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    convo_id = data.get("conversationId") or data.get("id")
    if not convo_id:
        raise AppError("conversationId required", 400)
    convo = await Conversation.get(convo_id)
    if not convo or PydanticObjectId(user_id) not in convo.participantIds:
        raise AppError("Not found" if not convo else "Forbidden", 404 if not convo else 403)
    await Message.find(Message.conversationId == convo.id).delete()
    await convo.delete()
    return {"success": True}


@action("conversations.send")
async def send_message(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    convo_id = data.get("conversationId") or data.get("id")
    if not convo_id:
        raise AppError("conversationId required", 400)
    body = SendMessageIn.model_validate(data)
    convo = await Conversation.get(convo_id)
    if not convo or PydanticObjectId(user_id) not in convo.participantIds:
        raise AppError("Not found" if not convo else "Forbidden", 404 if not convo else 403)
    other = next((str(p) for p in convo.participantIds if str(p) != user_id), None)
    if other:
        await require_mutual_follow_for_dm(user_id, other)
    now = datetime.utcnow()
    msg = Message(
        conversationId=PydanticObjectId(convo_id),
        senderId=PydanticObjectId(user_id),
        content=body.content,
        mediaUrls=body.mediaUrls,
        createdAt=now,
    )
    await msg.insert()
    convo.lastMessage = LastMessage(content=body.content, senderId=PydanticObjectId(user_id), createdAt=now)
    if other:
        convo.unreadCounts[other] = convo.unreadCounts.get(other, 0) + 1
    await convo.save()
    payload = {
        "id": str(msg.id),
        "conversationId": convo_id,
        "senderId": user_id,
        "content": msg.content,
        "mediaUrls": msg.mediaUrls,
        "createdAt": now.isoformat() + "Z",
    }
    sender_doc = await User.get(user_id)
    sender_public = user_out(sender_doc).model_dump() if sender_doc else None
    message_item = {
        "id": str(msg.id),
        "senderId": user_id,
        "sender": sender_public,
        "content": msg.content,
        "mediaUrls": msg.mediaUrls or [],
        "isRead": msg.isRead,
        "createdAt": now.isoformat() + "Z",
    }
    socket_payload = {"conversationId": convo_id, "message": message_item}
    await broadcast_conversation_message(convo_id, message_item)
    if other:
        await emit_message(other, socket_payload)
    return {"message": message_item}
