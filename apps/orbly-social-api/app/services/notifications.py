"""Bildirim oluşturma + Socket.IO canlı push."""

from __future__ import annotations

from datetime import datetime

from beanie import PydanticObjectId

from app.models.like import Like
from app.models.notification import Notification
from app.models.post import Post
from app.models.user import User
from app.services.post_thread import get_thread_root_id
from app.services.realtime import emit_notification
from app.services.serializers import _ts, user_out


async def _post_preview(
    post_id: PydanticObjectId | None,
    *,
    viewer_id: str,
) -> dict | None:
    if not post_id:
        return None
    post = await Post.get(post_id)
    if not post or post.isDeleted:
        return None
    uid = PydanticObjectId(viewer_id)
    liked = await Like.find_one(Like.userId == uid, Like.postId == post.id) is not None
    reply_to_username = None
    if post.replyToId:
        parent = await Post.get(post.replyToId)
        if parent:
            author = await User.get(parent.authorId)
            if author:
                reply_to_username = author.username
    root_id = await get_thread_root_id(post.id)
    return {
        "id": str(post.id),
        "content": (post.content or "")[:280],
        "mediaUrl": post.mediaUrls[0] if post.mediaUrls else None,
        "replyToId": str(post.replyToId) if post.replyToId else None,
        "threadRootId": str(root_id),
        "replyToUsername": reply_to_username,
        "stats": {
            "likeCount": post.stats.likeCount,
            "replyCount": post.stats.replyCount,
            "repostCount": post.stats.repostCount,
            "viewCount": post.stats.viewCount,
        },
        "likedByMe": liked,
    }


async def notify_user(
    user_id: str,
    actor_id: str,
    ntype: str,
    post_id: PydanticObjectId | None = None,
) -> None:
    """DB kaydı + `notification` socket (rozet için unreadCount dahil)."""
    if user_id == actor_id:
        return
    uid = PydanticObjectId(user_id)
    n = Notification(
        userId=uid,
        actorId=PydanticObjectId(actor_id),
        type=ntype,
        postId=post_id,
    )
    await n.insert()
    actor = await User.get(actor_id)
    preview = await _post_preview(post_id, viewer_id=user_id)
    unread = await Notification.find(
        Notification.userId == uid,
        Notification.isRead == False,
    ).count()
    await emit_notification(
        user_id,
        {
            "id": str(n.id),
            "type": ntype,
            "postId": str(post_id) if post_id else None,
            "isRead": False,
            "actor": user_out(actor).model_dump(mode="json") if actor else None,
            "createdAt": _ts(n),
            "postPreview": preview,
            "unreadCount": unread,
        },
    )
