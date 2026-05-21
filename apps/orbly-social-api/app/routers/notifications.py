from beanie import PydanticObjectId
from fastapi import APIRouter, Query

from app.commands.notifications_cmds import read_all, read_one
from app.deps import UserId
from app.models.like import Like
from app.models.notification import Notification
from app.models.post import Post
from app.models.user import User
from app.services.post_thread import get_thread_root_id
from app.services.serializers import _ts, user_out
from app.utils import parse_limit

router = APIRouter()


@router.post("/read-all")
async def rest_read_all_notifications(user_id: UserId):
    return await read_all(user_id, {})


@router.post("/{notification_id}/read")
async def rest_read_notification(user_id: UserId, notification_id: str):
    return await read_one(user_id, {"notificationId": notification_id})


@router.get("")
@router.get("/")
async def list_notifications(
    user_id: UserId,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    unreadOnly: str | None = None,
):
    lim = parse_limit(limit)
    uid = PydanticObjectId(user_id)
    q: dict = {"userId": uid}
    if unreadOnly == "true":
        q["isRead"] = False
    if cursor:
        q["_id"] = {"$lt": PydanticObjectId(cursor)}
    notifs = await Notification.find(q).sort(-Notification.id).limit(lim + 1).to_list()
    has_more = len(notifs) > lim
    slice_n = notifs[:lim]

    actor_ids = [n.actorId for n in slice_n if n.actorId]
    actors = await User.find({"_id": {"$in": actor_ids}}).to_list() if actor_ids else []
    amap = {a.id: a for a in actors}

    post_ids = [n.postId for n in slice_n if n.postId]
    posts = await Post.find({"_id": {"$in": post_ids}}).to_list() if post_ids else []
    pmap = {p.id: p for p in posts}

    parent_ids = [p.replyToId for p in posts if p.replyToId]
    parents = await Post.find({"_id": {"$in": parent_ids}}).to_list() if parent_ids else []
    parent_map = {p.id: p for p in parents}
    parent_author_ids = [p.authorId for p in parents]
    parent_authors = (
        await User.find({"_id": {"$in": parent_author_ids}}).to_list() if parent_author_ids else []
    )
    parent_author_map = {u.id: u for u in parent_authors}

    liked_post_ids: set[PydanticObjectId] = set()
    if post_ids:
        likes = await Like.find({"userId": uid, "postId": {"$in": post_ids}}).to_list()
        liked_post_ids = {lk.postId for lk in likes}

    unread = await Notification.find(Notification.userId == uid, Notification.isRead == False).count()

    root_cache: dict[PydanticObjectId, str] = {}

    async def thread_root_str(pid: PydanticObjectId) -> str:
        if pid in root_cache:
            return root_cache[pid]
        root_id = await get_thread_root_id(pid)
        root_cache[pid] = str(root_id)
        return root_cache[pid]

    async def post_preview(pid: PydanticObjectId | None) -> dict | None:
        if not pid or pid not in pmap:
            return None
        p = pmap[pid]
        reply_to_username = None
        if p.replyToId and p.replyToId in parent_map:
            parent = parent_map[p.replyToId]
            author = parent_author_map.get(parent.authorId)
            if author:
                reply_to_username = author.username

        return {
            "id": str(p.id),
            "content": (p.content or "")[:280],
            "mediaUrl": p.mediaUrls[0] if p.mediaUrls else None,
            "replyToId": str(p.replyToId) if p.replyToId else None,
            "threadRootId": await thread_root_str(p.id),
            "replyToUsername": reply_to_username,
            "stats": {
                "likeCount": p.stats.likeCount,
                "replyCount": p.stats.replyCount,
                "repostCount": p.stats.repostCount,
                "viewCount": p.stats.viewCount,
            },
            "likedByMe": p.id in liked_post_ids,
        }

    rows = []
    for n in slice_n:
        preview = await post_preview(n.postId)
        rows.append(
            {
                "id": str(n.id),
                "type": n.type,
                "postId": str(n.postId) if n.postId else None,
                "isRead": n.isRead,
                "actor": user_out(amap[n.actorId]) if n.actorId and n.actorId in amap else None,
                "createdAt": _ts(n),
                "postPreview": preview,
            }
        )

    return {
        "data": rows,
        "unreadCount": unread,
        "nextCursor": str(slice_n[-1].id) if has_more and slice_n else None,
        "hasMore": has_more,
    }
