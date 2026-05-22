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
from app.models.post_view import PostView
from app.models.orbit import Orbit
from app.models.post import Poll, PollOption, Post
from app.models.user import User
from app.schemas.posts import CreatePostIn, PollVoteIn, RepostIn, UpdatePostIn
from app.services.feed_fanout import fanout_post
from app.services.feed_ranking import resolve_orbit_from_hashtags
from app.services.posts import enrich_posts, extract_hashtags, extract_mentions
from app.services.notifications import notify_user
from app.services.post_thread import get_thread_root_id
from app.services.realtime_broadcast import broadcast_post_reply, broadcast_post_stats
from app.services.redis_client import trending_incr
from app.services.serializers import post_out, user_out


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
            await notify_user(str(parent.authorId), user_id, "reply", post.id)
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
    mentioned: set[str] = set()
    for u in mentions:
        mid = str(u.id)
        if mid != user_id and mid not in mentioned:
            mentioned.add(mid)
            await notify_user(mid, user_id, "mention", post.id)
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
        await notify_user(str(post.authorId), user_id, "like", pid)
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


async def _repost_target(original: Post) -> Post:
    """Alıntılanan gönderi bir rewet ise kök gönderiye in (X davranışı)."""
    if original.repostOfId and not (original.content or "").strip():
        root = await Post.find_one(
            Post.id == original.repostOfId, Post.isDeleted == False
        )
        if root:
            return root
    return original


@action("posts.repost")
async def repost(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    body = RepostIn.model_validate({k: v for k, v in data.items() if k != "postId" and k != "id"})
    original = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not original:
        raise AppError("Post not found", 404)
    original = await _repost_target(original)
    if str(original.authorId) == user_id:
        raise AppError("Cannot repost your own post", 400)

    quote = (body.content or "").strip()
    existing = await Post.find_one(
        Post.authorId == PydanticObjectId(user_id),
        Post.repostOfId == original.id,
        Post.isDeleted == False,
    )
    if existing and not quote:
        raise AppError("Already reposted", 400)

    now = datetime.utcnow()
    post = Post(
        authorId=PydanticObjectId(user_id),
        content=quote,
        repostOfId=original.id,
        orbitId=original.orbitId,
        createdAt=now,
        updatedAt=now,
    )
    await post.insert()
    await Post.find_one(Post.id == original.id).update({"$inc": {"stats.repostCount": 1}})
    await User.find_one(User.id == PydanticObjectId(user_id)).update({"$inc": {"stats.postsCount": 1}})
    if str(original.authorId) != user_id:
        await notify_user(str(original.authorId), user_id, "repost", original.id)
    asyncio.create_task(fanout_post(post))
    author = await User.get(user_id)
    enriched = await enrich_posts([post], viewer_id=user_id)
    return to_jsonable(
        {
            "post": enriched[0] if enriched else post_out(post, author, viewer_id=user_id),
            "reposted": True,
        }
    )


@action("posts.unrepost")
async def unrepost(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    original = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not original:
        raise AppError("Post not found", 404)
    original = await _repost_target(original)
    mine = await Post.find_one(
        Post.authorId == PydanticObjectId(user_id),
        Post.repostOfId == original.id,
        Post.isDeleted == False,
    )
    if not mine:
        return {"reposted": False, "repostCount": original.stats.repostCount}
    mine.isDeleted = True
    mine.updatedAt = datetime.utcnow()
    await mine.save()
    await Post.find_one(Post.id == original.id).update({"$inc": {"stats.repostCount": -1}})
    await User.find_one(User.id == PydanticObjectId(user_id)).update({"$inc": {"stats.postsCount": -1}})
    updated = await Post.get(original.id)
    count = updated.stats.repostCount if updated else 0
    if updated:
        await broadcast_post_stats(str(original.id), actor_id=user_id, action="unrepost", post=updated)
    return {"reposted": False, "repostCount": max(0, count)}


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


@action("posts.view")
async def view_post(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    """Her kullanıcı–gönderi çifti için en fazla bir görüntülenme."""
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    if not user_id:
        raise AppError("Unauthorized", 401)

    post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not post:
        raise AppError("Post not found", 404)

    uid, pid = PydanticObjectId(user_id), PydanticObjectId(post_id)
    if post.authorId == uid:
        return {
            "success": True,
            "counted": False,
            "viewCount": post.stats.viewCount,
        }

    existing = await PostView.find_one(PostView.userId == uid, PostView.postId == pid)
    if existing:
        return {
            "success": True,
            "counted": False,
            "viewCount": post.stats.viewCount,
        }

    try:
        await PostView(userId=uid, postId=pid).insert()
    except DuplicateKeyError:
        return {
            "success": True,
            "counted": False,
            "viewCount": post.stats.viewCount,
        }

    await Post.find_one(Post.id == pid).update({"$inc": {"stats.viewCount": 1}})
    updated = await Post.get(post_id)
    view_count = updated.stats.viewCount if updated else post.stats.viewCount + 1
    if updated:
        await broadcast_post_stats(post_id, actor_id=user_id, action="view", post=updated)
    return {"success": True, "counted": True, "viewCount": view_count}
