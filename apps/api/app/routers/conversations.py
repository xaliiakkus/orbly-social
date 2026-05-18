from datetime import datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.deps import UserId
from app.models.conversation import Conversation, LastMessage
from app.models.message import Message
from app.models.user import User
from app.services.realtime import emit_message
from app.services.serializers import _ts, user_out
from app.utils import parse_limit

router = APIRouter()


class CreateConversationIn(BaseModel):
    participantId: str


class SendMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    mediaUrls: list[str] = Field(default_factory=list, max_length=4)


@router.get("/")
async def list_conversations(user_id: UserId):
    oid = PydanticObjectId(user_id)
    convos = await Conversation.find({"participantIds": oid}).sort(-Conversation.id).limit(50).to_list()
    other_ids = []
    for c in convos:
        for pid in c.participantIds:
            if pid != oid:
                other_ids.append(pid)
    users = await User.find({"_id": {"$in": other_ids}}).to_list()
    umap = {u.id: u for u in users}
    return {
        "data": [
            {
                "id": str(c.id),
                "participant": user_out(umap[p])
                if (p := next((x for x in c.participantIds if x != oid), None)) and p in umap
                else None,
                "lastMessage": {
                    "content": c.lastMessage.content,
                    "senderId": str(c.lastMessage.senderId),
                    "createdAt": c.lastMessage.createdAt.isoformat().replace("+00:00", "Z")
                    if c.lastMessage.createdAt
                    else "",
                }
                if c.lastMessage
                else None,
                "unreadCount": c.unreadCounts.get(user_id, 0) if c.unreadCounts else 0,
                "updatedAt": _ts(c),
            }
            for c in convos
        ]
    }


@router.post("/", status_code=201)
async def create_conversation(body: CreateConversationIn, user_id: UserId):
    if body.participantId == user_id:
        raise HTTPException(400, "Invalid participant")
    target = await User.get(body.participantId)
    if not target:
        raise HTTPException(404, "User not found")
    ids = sorted([user_id, body.participantId])
    oids = [PydanticObjectId(ids[0]), PydanticObjectId(ids[1])]
    convo = await Conversation.find_one({"participantIds": {"$all": oids, "$size": 2}})
    if not convo:
        convo = Conversation(participantIds=oids, unreadCounts={})
        await convo.insert()
    return {"conversationId": str(convo.id)}


@router.delete("/{convo_id}")
async def delete_conversation(convo_id: str, user_id: UserId):
    convo = await Conversation.get(convo_id)
    if not convo or PydanticObjectId(user_id) not in convo.participantIds:
        raise HTTPException(404 if not convo else 403, "Not found" if not convo else "Forbidden")
    await Message.find(Message.conversationId == convo.id).delete()
    await convo.delete()
    return {"success": True}


@router.get("/{convo_id}/messages")
async def get_messages(
    convo_id: str,
    user_id: UserId,
    before: str | None = None,
    limit: int = Query(20, ge=1, le=50),
):
    convo = await Conversation.get(convo_id)
    if not convo or PydanticObjectId(user_id) not in convo.participantIds:
        raise HTTPException(404 if not convo else 403, "Not found" if not convo else "Forbidden")
    lim = parse_limit(limit)
    q = {"conversationId": PydanticObjectId(convo_id)}
    if before:
        q["createdAt"] = {"$lt": datetime.fromisoformat(before.replace("Z", ""))}
    msgs = await Message.find(q).sort(-Message.id).limit(lim).to_list()
    convo.unreadCounts[user_id] = 0
    await convo.save()
    return {
        "data": [
            {
                "id": str(m.id),
                "senderId": str(m.senderId),
                "content": m.content,
                "mediaUrls": m.mediaUrls or [],
                "isRead": m.isRead,
                "createdAt": _ts(m),
            }
            for m in reversed(msgs)
        ]
    }


@router.post("/{convo_id}/messages", status_code=201)
async def send_message(convo_id: str, body: SendMessageIn, user_id: UserId):
    convo = await Conversation.get(convo_id)
    if not convo or PydanticObjectId(user_id) not in convo.participantIds:
        raise HTTPException(404 if not convo else 403, "Not found" if not convo else "Forbidden")
    now = datetime.utcnow()
    msg = Message(
        conversationId=PydanticObjectId(convo_id),
        senderId=PydanticObjectId(user_id),
        content=body.content,
        mediaUrls=body.mediaUrls,
        createdAt=now,
    )
    await msg.insert()
    other = next((str(p) for p in convo.participantIds if str(p) != user_id), None)
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
    if other:
        await emit_message(other, payload)
    return {"message": payload}
