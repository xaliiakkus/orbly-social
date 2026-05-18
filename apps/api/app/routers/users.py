from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.deps import OptionalUserId, UserId
from app.models.follow import Follow
from app.models.notification import Notification
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PaginatedPosts, PaginatedUsers, UserOut
from app.services.posts import enrich_posts
from app.services.serializers import user_out
from app.utils import decode_cursor, encode_cursor, parse_limit

router = APIRouter()


class UpdateProfileIn(BaseModel):
    displayName: str | None = Field(None, min_length=1, max_length=100)
    bio: str | None = Field(None, max_length=160)
    location: str | None = Field(None, max_length=100)
    website: str | None = Field(None, max_length=255)
    avatarUrl: str | None = None
    bannerUrl: str | None = None
    isPrivate: bool | None = None


@router.get("/me")
async def get_me(user_id: UserId):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return {"user": user_out(user)}


@router.patch("/me")
async def patch_me(body: UpdateProfileIn, user_id: UserId):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    await user.save()
    return {"user": user_out(user)}


@router.get("/{username}")
async def get_user(username: str, viewer_id: OptionalUserId = None):
    user = await User.find_one(User.username == username.lower(), User.isBanned == False)
    if not user:
        raise HTTPException(404, "User not found")
    is_following = False
    if viewer_id:
        is_following = await Follow.find_one(
            Follow.followerId == PydanticObjectId(viewer_id),
            Follow.followingId == user.id,
        ) is not None
    return {
        "user": user_out(user),
        "isFollowing": is_following,
        "isSelf": viewer_id == str(user.id),
    }


@router.get("/{username}/posts", response_model=PaginatedPosts)
async def user_posts(
    username: str,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    viewer_id: OptionalUserId = None,
):
    user = await User.find_one(User.username == username.lower())
    if not user:
        raise HTTPException(404, "User not found")
    lim = parse_limit(limit)
    q = Post.find(Post.authorId == user.id, Post.isDeleted == False, Post.replyToId == None)
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            q = q.find(Post.createdAt < decoded[0])
    posts = await q.sort(-Post.createdAt).limit(lim + 1).to_list()
    has_more = len(posts) > lim
    slice_p = posts[:lim] if has_more else posts
    last = slice_p[-1] if slice_p else None
    return PaginatedPosts(
        data=await enrich_posts(slice_p, viewer_id),
        nextCursor=encode_cursor(last.createdAt, last.id) if has_more and last and last.createdAt else None,
        hasMore=has_more,
    )


@router.post("/{user_id}/follow", status_code=201)
async def follow(user_id: str, current: UserId):
    if user_id == current:
        raise HTTPException(400, "Cannot follow yourself")
    target = await User.get(user_id)
    if not target:
        raise HTTPException(404, "User not found")
    oid = PydanticObjectId(current)
    tid = PydanticObjectId(user_id)
    if await Follow.find_one(Follow.followerId == oid, Follow.followingId == tid):
        return {"following": True}
    await Follow(followerId=oid, followingId=tid).insert()
    await User.find_one(User.id == oid).update({"$inc": {"stats.followingCount": 1}})
    await User.find_one(User.id == tid).update({"$inc": {"stats.followersCount": 1}})
    await Notification(userId=tid, actorId=oid, type="follow").insert()
    return {"following": True}


@router.delete("/{user_id}/follow")
async def unfollow(user_id: str, current: UserId):
    oid, tid = PydanticObjectId(current), PydanticObjectId(user_id)
    removed = await Follow.find_one(Follow.followerId == oid, Follow.followingId == tid)
    if removed:
        await removed.delete()
        await User.find_one(User.id == oid).update({"$inc": {"stats.followingCount": -1}})
        await User.find_one(User.id == tid).update({"$inc": {"stats.followersCount": -1}})
    return {"following": False}


async def _paginate_users(follows: list, field: str, cursor: str | None, limit: int) -> PaginatedUsers:
    lim = parse_limit(limit)
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            follows = [f for f in follows if f.createdAt and f.createdAt < decoded[0]]
    has_more = len(follows) > lim
    slice_f = follows[:lim]
    ids = [getattr(f, field) for f in slice_f]
    users = await User.find({"_id": {"$in": ids}}).to_list()
    umap = {u.id: u for u in users}
    data = [user_out(umap[i]) for i in ids if i in umap]
    last = slice_f[-1] if slice_f else None
    nc = encode_cursor(last.createdAt, last.id) if has_more and last and getattr(last, "createdAt", None) else None
    return PaginatedUsers(data=data, nextCursor=nc, hasMore=has_more)


@router.get("/{username}/followers", response_model=PaginatedUsers)
async def followers(username: str, cursor: str | None = None, limit: int = Query(20, ge=1, le=50)):
    user = await User.find_one(User.username == username.lower())
    if not user:
        raise HTTPException(404, "User not found")
    follows = await Follow.find(Follow.followingId == user.id).sort(-Follow.id).limit(parse_limit(limit) + 50).to_list()
    return await _paginate_users(follows, "followerId", cursor, limit)


@router.get("/{username}/following", response_model=PaginatedUsers)
async def following(username: str, cursor: str | None = None, limit: int = Query(20, ge=1, le=50)):
    user = await User.find_one(User.username == username.lower())
    if not user:
        raise HTTPException(404, "User not found")
    follows = await Follow.find(Follow.followerId == user.id).sort(-Follow.id).limit(parse_limit(limit) + 50).to_list()
    return await _paginate_users(follows, "followingId", cursor, limit)
