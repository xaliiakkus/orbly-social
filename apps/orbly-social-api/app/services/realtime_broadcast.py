from __future__ import annotations

from typing import Any

from app.models.post import Post
from app.services.realtime import sio


async def emit_room(room: str, event: str, data: dict[str, Any]) -> None:
    await sio.emit(event, data, room=room)


def post_room(post_id: str) -> str:
    return f"post:{post_id}"


def convo_room(conversation_id: str) -> str:
    return f"convo:{conversation_id}"


def _stats_payload(post: Post) -> dict[str, int]:
    s = post.stats
    return {
        "likeCount": s.likeCount,
        "replyCount": s.replyCount,
        "repostCount": s.repostCount,
        "viewCount": s.viewCount,
        "bookmarkCount": s.bookmarkCount,
    }


async def broadcast_post_stats(
    post_id: str,
    *,
    actor_id: str,
    action: str,
    post: Post | None = None,
) -> None:
    if post is None:
        post = await Post.get(post_id)
    if not post:
        return
    await emit_room(
        post_room(post_id),
        "post:stats",
        {
            "postId": post_id,
            "stats": _stats_payload(post),
            "actorId": actor_id,
            "action": action,
        },
    )


async def broadcast_post_reply(
    parent_id: str,
    *,
    reply: dict[str, Any],
    actor_id: str,
) -> None:
    await emit_room(
        post_room(parent_id),
        "post:reply",
        {"parentId": parent_id, "reply": reply, "actorId": actor_id},
    )


async def broadcast_conversation_message(
    conversation_id: str,
    message: dict[str, Any],
) -> None:
    await emit_room(
        convo_room(conversation_id),
        "message",
        {"conversationId": conversation_id, "message": message},
    )


async def broadcast_user_action(
    target_user_id: str,
    *,
    action: str,
    actor_id: str,
    payload: dict[str, Any] | None = None,
) -> None:
    from app.services.realtime import emit_to_user

    data: dict[str, Any] = {"action": action, "actorId": actor_id}
    if payload:
        data.update(payload)
    await emit_to_user(target_user_id, "user:action", data)
