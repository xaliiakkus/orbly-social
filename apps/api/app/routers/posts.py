import asyncio
import uuid
from datetime import datetime, timedelta

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.deps import OptionalUserId, UserId
from app.models.like import Like
from app.models.notification import Notification
from app.models.orbit import Orbit
from app.models.post import Poll, PollOption, Post
from app.models.user import User
from app.schemas.common import PaginatedPosts, PostOut
from app.services.feed_fanout import fanout_post
from app.services.posts import enrich_posts, extract_hashtags, extract_mentions
from app.services.realtime import emit_notification
from app.services.redis_client import trending_incr
from app.services.serializers import post_out, user_out
from app.utils import decode_cursor, encode_cursor, parse_limit

router = APIRouter()


class PollIn(BaseModel):
    options: list[str] = Field(min_length=2, max_length=4)
    durationHours: int = Field(default=24, ge=1, le=168)


class CreatePostIn(BaseModel):
    content: str = Field(min_length=1, max_length=280, examples=["Merhaba Orbly! #orbly"])
    mediaUrls: list[str] = Field(default_factory=list, max_length=4)
    replyToId: str | None = None
    repostOfId: str | None = None
    orbitId: str | None = None
    poll: PollIn | None = None


class RepostIn(BaseModel):
    content: str | None = Field(None, max_length=280)


class PollVoteIn(BaseModel):
    optionId: str


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
            "actor": user_out(actor).model_dump() if actor else None,
            "createdAt": datetime.utcnow().isoformat() + "Z",
        },
    )


@router.post("/", status_code=201)
async def create_post(body: CreatePostIn, user_id: UserId):
    if len(body.mediaUrls) > 4:
        raise HTTPException(400, "Max 4 images")
    mentions = await User.find({"username": {"$in": extract_mentions(body.content)}}).to_list()
    now = datetime.utcnow()
    poll = None
    if body.poll:
        poll = Poll(
            options=[
                PollOption(id=str(uuid.uuid4())[:8], text=t[:25])
                for t in body.poll.options
            ],
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
        orbitId=PydanticObjectId(body.orbitId) if body.orbitId else None,
        hashtags=extract_hashtags(body.content),
        mentions=[u.id for u in mentions],
        poll=poll,
    )
    await post.insert()
    await User.find_one(User.id == PydanticObjectId(user_id)).update({"$inc": {"stats.postsCount": 1}})
    for tag in post.hashtags:
        await trending_incr(tag)
    if body.orbitId:
        await Orbit.find_one(Orbit.id == PydanticObjectId(body.orbitId)).update(
            {"$inc": {"stats.postCount": 1}}
        )
    if body.replyToId:
        parent = await Post.get(body.replyToId)
        await Post.find_one(Post.id == PydanticObjectId(body.replyToId)).update(
            {"$inc": {"stats.replyCount": 1}}
        )
        if parent and str(parent.authorId) != user_id:
            await _notify(str(parent.authorId), user_id, "reply", post.id)
    if not body.replyToId:
        asyncio.create_task(fanout_post(post))
    author = await User.get(user_id)
    orbit = await Orbit.get(body.orbitId) if body.orbitId else None
    return {"post": post_out(post, author, orbit, viewer_id=user_id)}


@router.get("/{post_id}")
async def get_post(post_id: str, viewer_id: OptionalUserId = None):
    post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not post:
        raise HTTPException(404, "Post not found")
    enriched = await enrich_posts([post], viewer_id)
    return {"post": enriched[0]}


@router.delete("/{post_id}")
async def delete_post(post_id: str, user_id: UserId):
    post = await Post.get(post_id)
    if not post or post.isDeleted:
        raise HTTPException(404, "Post not found")
    if str(post.authorId) != user_id:
        raise HTTPException(403, "Forbidden")
    post.isDeleted = True
    await post.save()
    await User.find_one(User.id == PydanticObjectId(user_id)).update({"$inc": {"stats.postsCount": -1}})
    return {"success": True}


@router.post("/{post_id}/like", status_code=201)
async def like_post(post_id: str, user_id: UserId):
    post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not post:
        raise HTTPException(404, "Post not found")
    oid, pid = PydanticObjectId(user_id), PydanticObjectId(post_id)
    if await Like.find_one(Like.userId == oid, Like.postId == pid):
        return {"liked": True}
    await Like(userId=oid, postId=pid).insert()
    await Post.find_one(Post.id == pid).update({"$inc": {"stats.likeCount": 1}})
    if str(post.authorId) != user_id:
        await _notify(str(post.authorId), user_id, "like", pid)
    return {"liked": True}


@router.delete("/{post_id}/like")
async def unlike_post(post_id: str, user_id: UserId):
    oid, pid = PydanticObjectId(user_id), PydanticObjectId(post_id)
    like = await Like.find_one(Like.userId == oid, Like.postId == pid)
    if like:
        await like.delete()
        await Post.find_one(Post.id == pid).update({"$inc": {"stats.likeCount": -1}})
    return {"liked": False}


@router.post("/{post_id}/repost", status_code=201)
async def repost(post_id: str, body: RepostIn, user_id: UserId):
    original = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not original:
        raise HTTPException(404, "Post not found")
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
    return {"post": post_out(post, author, viewer_id=user_id)}


@router.post("/{post_id}/poll/vote")
async def vote_poll(post_id: str, body: PollVoteIn, user_id: UserId):
    post = await Post.get(post_id)
    if not post or not post.poll:
        raise HTTPException(404, "Poll not found")
    if post.poll.endsAt <= datetime.utcnow():
        raise HTTPException(400, "Poll ended")
    if user_id in post.pollVotes:
        raise HTTPException(400, "Already voted")
    opt = next((o for o in post.poll.options if o.id == body.optionId), None)
    if not opt:
        raise HTTPException(400, "Invalid option")
    opt.voteCount += 1
    post.poll.totalVotes += 1
    post.pollVotes[user_id] = body.optionId
    await post.save()
    enriched = await enrich_posts([post], user_id)
    return {"post": enriched[0]}


@router.get("/{post_id}/replies", response_model=PaginatedPosts)
async def replies(
    post_id: str,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    viewer_id: OptionalUserId = None,
):
    lim = parse_limit(limit)
    q = Post.find(Post.replyToId == PydanticObjectId(post_id), Post.isDeleted == False)
    posts = await q.sort(-Post.id).limit(lim + 1).to_list()
    has_more = len(posts) > lim
    slice_p = posts[:lim]
    last = slice_p[-1] if slice_p else None
    return PaginatedPosts(
        data=await enrich_posts(slice_p, viewer_id),
        nextCursor=encode_cursor(last.createdAt, last.id) if has_more and last and getattr(last, "createdAt", None) else (str(last.id) if has_more and last else None),
        hasMore=has_more,
    )


@router.post("/{post_id}/view")
async def view_post(post_id: str):
    await Post.find_one(Post.id == PydanticObjectId(post_id)).update({"$inc": {"stats.viewCount": 1}})
    return {"success": True}
