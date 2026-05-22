from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import APIRouter, HTTPException, Query
from app.deps import OptionalUserId, UserId
from app.models.follow import Follow
from app.models.live_channel import LiveChannel
from app.models.orbit import Orbit
from app.models.post import Post
from app.models.user import User
from app.commands.users_cmds import follow as follow_user, unfollow as unfollow_user, update_me
from app.schemas.common import PaginatedPosts, PaginatedUsers
from app.schemas.users import UpdateProfileIn
from app.services.posts import enrich_posts
from app.services.follow_checks import is_mutual_follow, viewer_follows
from app.services.serializers import orbit_out, user_out
from app.utils import decode_cursor, encode_cursor, parse_limit

router = APIRouter()


@router.get("/me")
async def get_me(user_id: UserId):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return {"user": user_out(user)}


@router.patch("/me")
async def patch_me(user_id: UserId, body: UpdateProfileIn):
    """REST fallback when socket RPC is unavailable (mobile dev / offline socket)."""
    return await update_me(user_id, body.model_dump(exclude_unset=True))


@router.post("/me/following/{target_id}")
async def rest_follow(user_id: UserId, target_id: str):
    """Socket RPC yedek — mobil/web takip."""
    return await follow_user(user_id, {"userId": target_id})


@router.delete("/me/following/{target_id}")
async def rest_unfollow(user_id: UserId, target_id: str):
    return await unfollow_user(user_id, {"userId": target_id})


@router.get("/{username}")
async def get_user(username: str, viewer_id: OptionalUserId = None):
    user = await User.find_one(User.username == username.lower(), User.isBanned == False)
    if not user:
        raise HTTPException(404, "User not found")
    is_self = viewer_id == str(user.id)
    is_following = False
    is_followed_by = False
    if viewer_id and not is_self:
        is_following = await viewer_follows(viewer_id, str(user.id))
        is_followed_by = await viewer_follows(str(user.id), viewer_id)
    can_message = is_self or (
        bool(viewer_id) and await is_mutual_follow(viewer_id, str(user.id))
    )
    return {
        "user": user_out(user),
        "isFollowing": is_following,
        "isFollowedBy": is_followed_by,
        "canMessage": can_message,
        "isSelf": is_self,
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


@router.get("/{username}/broadcasts")
async def user_broadcasts(username: str, limit: int = Query(20, ge=1, le=50)):
    user = await User.find_one(User.username == username.lower())
    if not user:
        raise HTTPException(404, "User not found")
    channels = (
        await LiveChannel.find(
            LiveChannel.hostId == user.id,
            LiveChannel.status == "ended",
        )
        .sort(-LiveChannel.endedAt)
        .limit(limit)
        .to_list()
    )
    from app.commands.live_cmds import _stats_out

    return {"data": [await _stats_out(c, user) for c in channels]}


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


@router.get("/{username}/orbits")
async def user_orbits(username: str):
    user = await User.find_one(User.username == username.lower(), User.isBanned == False)
    if not user:
        raise HTTPException(404, "User not found")
    orbit_ids = list(user.orbitIds or [])
    if not orbit_ids:
        return {"data": []}
    orbits = await Orbit.find(In(Orbit.id, orbit_ids)).to_list()
    order = {oid: i for i, oid in enumerate(orbit_ids)}
    orbits.sort(key=lambda o: order.get(o.id, 999))
    return {"data": [orbit_out(o) for o in orbits]}


@router.get("/{username}/mutual-followers")
async def mutual_followers(
    username: str,
    viewer_id: OptionalUserId = None,
    limit: int = Query(3, ge=1, le=20),
):
    """Görüntüleyenin takip ettiği ve bu profili de takip eden kullanıcılar."""
    if not viewer_id:
        return {"data": [], "totalCount": 0}
    user = await User.find_one(User.username == username.lower(), User.isBanned == False)
    if not user:
        raise HTTPException(404, "User not found")
    if viewer_id == str(user.id):
        return {"data": [], "totalCount": 0}

    viewer_following = await Follow.find(Follow.followerId == PydanticObjectId(viewer_id)).to_list()
    following_ids = [f.followingId for f in viewer_following]
    if not following_ids:
        return {"data": [], "totalCount": 0}

    base_q = Follow.find(
        Follow.followingId == user.id,
        In(Follow.followerId, following_ids),
    )
    total = await base_q.count()
    lim = parse_limit(limit)
    mutual = await base_q.sort(-Follow.id).limit(lim).to_list()
    ids = [f.followerId for f in mutual]
    users = await User.find(In(User.id, ids)).to_list()
    umap = {u.id: u for u in users}
    data = [user_out(umap[i]) for i in ids if i in umap]
    return {"data": data, "totalCount": total}
