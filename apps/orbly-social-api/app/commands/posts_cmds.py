from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Any

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from app.commands.json_util import to_jsonable
from app.commands.registry import action
from app.errors import AppError
from app.models.like import Like
from app.models.notification import Notification
from app.models.orbit import Orbit
from app.models.post import Poll, PollOption, Post
from app.models.user import User
from app.schemas.posts import CreatePostIn, PollVoteIn, RepostIn, UpdatePostIn
from app.services.feed_fanout import fanout_post
from app.services.feed_ranking import resolve_orbit_from_hashtags
from app.services.posts import enrich_posts, extract_hashtags, extract_mentions
from app.services.realtime import emit_notification
from app.services.post_thread import get_thread_root_id
from app.services.realtime_broadcast import broadcast_post_reply, broadcast_post_stats
from app.services.redis_client import trending_incr
from app.services.serializers import post_out, user_out


async def _notify(user_id: str, actor_id: str, ntype: str, post_id: PydanticObjectId | None = None) -> None:
    n = Notification(
        userId=PydanticObjectId(user_id),
        actorId=PydanticObjectId(actor_id),
        type=ntype,
        postId=post_id,
    )
    await n.insert()
    actor = await User.get(actor_id)
    await emit_notification(
        user_id,
        {
            "id": str(n.id),
            "type": ntype,
            "postId": str(post_id) if post_id else None,
            "isRead": False,
            "actor": user_out(actor).model_dump(mode="json") if actor else None,
            "createdAt": datetime.utcnow().isoformat() + "Z",
        },
    )


@action("posts.create")
async def create_post(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = CreatePostIn.model_validate(data)
    if len(body.mediaUrls) > 4:
        raise AppError("Max 4 images", 400)
    mentions = await User.find({"username": {"$in": extract_mentions(body.content)}}).to_list()
    hashtags = extract_hashtags(body.content)
    orbit_oid: PydanticObjectId | None = (
        PydanticObjectId(body.orbitId) if body.orbitId else None
    )
    if not orbit_oid:
        resolved = await resolve_orbit_from_hashtags(hashtags)
        if resolved:
            orbit_oid = resolved
    now = datetime.utcnow()
    poll = None
    if body.poll:
        poll = Poll(
            options=[PollOption(id=str(uuid.uuid4())[:8], text=t[:25]) for t in body.poll.options],
            endsAt=now + timedelta(hours=body.poll.durationHours),
        )
    post = Post(
        authorId=PydanticObjectId(user_id),
        content=body.content,
        createdAt=now,
        updatedAt=now,
        mediaUrls=body.mediaUrls,
        replyToId=PydanticObjectId(body.replyToId) if body.replyToId else None,
        repostOfId=PydanticObjectId(body.repostOfId) if body.repostOfId else None,
        orbitId=orbit_oid,
        hashtags=hashtags,
        mentions=[u.id for u in mentions],
        poll=poll,
    )
    await post.insert()
    await User.find_one(User.id == PydanticObjectId(user_id)).update({"$inc": {"stats.postsCount": 1}})
    for tag in post.hashtags:
        await trending_incr(tag)
    if orbit_oid:
        await Orbit.find_one(Orbit.id == orbit_oid).update({"$inc": {"stats.postCount": 1}})
    if body.replyToId:
        parent = await Post.get(body.replyToId)
        await Post.find_one(Post.id == PydanticObjectId(body.replyToId)).update(
            {"$inc": {"stats.replyCount": 1}}
        )
        root_id = await get_thread_root_id(body.replyToId)
        if root_id != PydanticObjectId(body.replyToId):
            await Post.find_one(Post.id == root_id).update({"$inc": {"stats.replyCount": 1}})
        if parent and str(parent.authorId) != user_id:
            await _notify(str(parent.authorId), user_id, "reply", post.id)
        author = await User.get(user_id)
        orbit = await Orbit.get(orbit_oid) if orbit_oid else None
        reply_out = post_out(post, author, orbit, viewer_id=user_id)
        await broadcast_post_reply(
            body.replyToId,
            reply=reply_out.model_dump(mode="json"),
            actor_id=user_id,
        )
        parent_post = await Post.get(body.replyToId)
        if parent_post:
            await broadcast_post_stats(
                body.replyToId,
                actor_id=user_id,
                action="reply",
                post=parent_post,
            )
    if not body.replyToId:
        asyncio.create_task(fanout_post(post))
    author = await User.get(user_id)
    orbit = await Orbit.get(orbit_oid) if orbit_oid else None
    return to_jsonable({"post": post_out(post, author, orbit, viewer_id=user_id)})


@action("posts.update")
async def update_post(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    body = UpdatePostIn.model_validate(
        {k: v for k, v in data.items() if k not in ("postId", "id")}
    )
    if len(body.mediaUrls) > 4:
        raise AppError("Max 4 images", 400)
    post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not post:
        raise AppError("Post not found", 404)
    if str(post.authorId) != user_id:
        raise AppError("Forbidden", 403)
    if post.repostOfId:
        raise AppError("Reposts cannot be edited", 400)
    mentions = await User.find({"username": {"$in": extract_mentions(body.content)}}).to_list()
    hashtags = extract_hashtags(body.content)
    post.content = body.content
    post.mediaUrls = body.mediaUrls
    post.hashtags = hashtags
    post.mentions = [u.id for u in mentions]
    post.updatedAt = datetime.utcnow()
    resolved = await resolve_orbit_from_hashtags(hashtags)
    if resolved:
        post.orbitId = resolved
    await post.save()
    author = await User.get(user_id)
    orbit = await Orbit.get(post.orbitId) if post.orbitId else None
    return to_jsonable({"post": post_out(post, author, orbit, viewer_id=user_id)})


@action("posts.delete")
async def delete_post(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    post = await Post.get(post_id)
    if not post or post.isDeleted:
        raise AppError("Post not found", 404)
    if str(post.authorId) != user_id:
        raise AppError("Forbidden", 403)
    post.isDeleted = True
    await post.save()
    await User.find_one(User.id == PydanticObjectId(user_id)).update({"$inc": {"stats.postsCount": -1}})
    return {"success": True}


@action("posts.like")
async def like_post(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not post:
        raise AppError("Post not found", 404)
    oid, pid = PydanticObjectId(user_id), PydanticObjectId(post_id)
    if await Like.find_one(Like.userId == oid, Like.postId == pid):
        return {"liked": True}
    try:
        await Like(userId=oid, postId=pid).insert()
    except DuplicateKeyError:
        return {"liked": True}
    await Post.find_one(Post.id == pid).update({"$inc": {"stats.likeCount": 1}})
    if str(post.authorId) != user_id:
        await _notify(str(post.authorId), user_id, "like", pid)
    updated = await Post.get(post_id)
    if updated:
        await broadcast_post_stats(post_id, actor_id=user_id, action="like", post=updated)
    return {"liked": True}


@action("posts.unlike")
async def unlike_post(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    oid, pid = PydanticObjectId(user_id), PydanticObjectId(post_id)
    like = await Like.find_one(Like.userId == oid, Like.postId == pid)
    if like:
        await like.delete()
        await Post.find_one(Post.id == pid).update({"$inc": {"stats.likeCount": -1}})
    updated = await Post.get(post_id)
    if updated:
        await broadcast_post_stats(post_id, actor_id=user_id, action="unlike", post=updated)
    return {"liked": False}


@action("posts.repost")
async def repost(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    body = RepostIn.model_validate({k: v for k, v in data.items() if k != "postId" and k != "id"})
    original = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not original:
        raise AppError("Post not found", 404)
    post = Post(
        authorId=PydanticObjectId(user_id),
        content=body.content or "",
        repostOfId=original.id,
        orbitId=original.orbitId,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    await post.insert()
    await Post.find_one(Post.id == original.id).update({"$inc": {"stats.repostCount": 1}})
    await User.find_one(User.id == PydanticObjectId(user_id)).update({"$inc": {"stats.postsCount": 1}})
    asyncio.create_task(fanout_post(post))
    author = await User.get(user_id)
    return to_jsonable({"post": post_out(post, author, viewer_id=user_id)})


@action("posts.poll.vote")
async def vote_poll(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    body = PollVoteIn.model_validate(data)
    post = await Post.get(post_id)
    if not post or not post.poll:
        raise AppError("Poll not found", 404)
    if post.poll.endsAt <= datetime.utcnow():
        raise AppError("Poll ended", 400)
    if user_id in post.pollVotes:
        raise AppError("Already voted", 400)
    opt = next((o for o in post.poll.options if o.id == body.optionId), None)
    if not opt:
        raise AppError("Invalid option", 400)
    opt.voteCount += 1
    post.poll.totalVotes += 1
    post.pollVotes[user_id] = body.optionId
    await post.save()
    enriched = await enrich_posts([post], user_id)
    return to_jsonable({"post": enriched[0]})


@action("posts.view", public=True)
async def view_post(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    await Post.find_one(Post.id == PydanticObjectId(post_id)).update({"$inc": {"stats.viewCount": 1}})
    return {"success": True}
