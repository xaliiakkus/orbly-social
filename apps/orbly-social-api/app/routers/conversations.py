from datetime import datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query

from app.deps import UserId
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.services.serializers import _ts, user_out
from app.utils import parse_limit

router = APIRouter()


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
    ordered = list(reversed(msgs))
    sender_ids = list({m.senderId for m in ordered})
    users = await User.find({"_id": {"$in": sender_ids}}).to_list()
    umap = {u.id: user_out(u).model_dump() for u in users}
    convo.unreadCounts[user_id] = 0
    await convo.save()
    return {
        "data": [
            {
                "id": str(m.id),
                "senderId": str(m.senderId),
                "sender": umap.get(m.senderId),
                "content": m.content,
                "mediaUrls": m.mediaUrls or [],
                "isRead": m.isRead,
                "createdAt": _ts(m),
            }
            for m in ordered
        ]
    }
