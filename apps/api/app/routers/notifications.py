from beanie import PydanticObjectId
from fastapi import APIRouter, Query

from app.deps import UserId
from app.models.notification import Notification
from app.services.serializers import user_out
from app.models.user import User
from app.utils import parse_limit

router = APIRouter()


@router.get("/")
async def list_notifications(
    user_id: UserId,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    unreadOnly: str | None = None,
):
    lim = parse_limit(limit)
    q = {"userId": PydanticObjectId(user_id)}
    if unreadOnly == "true":
        q["isRead"] = False
    notifs = await Notification.find(q).sort(-Notification.id).limit(lim + 1).to_list()
    has_more = len(notifs) > lim
    slice_n = notifs[:lim]
    actor_ids = [n.actorId for n in slice_n if n.actorId]
    actors = await User.find({"_id": {"$in": actor_ids}}).to_list() if actor_ids else []
    amap = {a.id: a for a in actors}
    unread = await Notification.find(Notification.userId == PydanticObjectId(user_id), Notification.isRead == False).count()
    return {
        "data": [
            {
                "id": str(n.id),
                "type": n.type,
                "postId": str(n.postId) if n.postId else None,
                "isRead": n.isRead,
                "actor": user_out(amap[n.actorId]) if n.actorId and n.actorId in amap else None,
                "createdAt": "",
            }
            for n in slice_n
        ],
        "unreadCount": unread,
        "nextCursor": str(slice_n[-1].id) if has_more and slice_n else None,
        "hasMore": has_more,
    }


@router.patch("/read-all")
async def read_all(user_id: UserId):
    oid = PydanticObjectId(user_id)
    async for n in Notification.find(Notification.userId == oid, Notification.isRead == False):
        n.isRead = True
        await n.save()
    return {"success": True}


@router.patch("/{notif_id}/read")
async def read_one(notif_id: str, user_id: UserId):
    n = await Notification.find_one(
        Notification.id == PydanticObjectId(notif_id),
        Notification.userId == PydanticObjectId(user_id),
    )
    if n:
        n.isRead = True
        await n.save()
    return {"success": True}
