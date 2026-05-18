from datetime import datetime, timedelta

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query

from app.deps import OptionalUserId, UserId
from app.models.follow import Follow
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PaginatedPosts
from app.services.aggregation import aggregate_to_list
from app.services.feed_ranking import (
    build_for_you_pipeline,
    for_you_since,
    load_interest_orbits,
    strip_ranking_fields,
)
from app.services.posts import enrich_posts
from app.services.redis_client import feed_get, redis_ok, trending_top
from app.utils import decode_cursor, parse_limit

router = APIRouter()


@router.get("/following", response_model=PaginatedPosts)
async def feed_following(
    user_id: UserId,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
):
    lim = parse_limit(limit)
    skip = int(cursor) if cursor and cursor.isdigit() else 0

    if redis_ok() and skip == 0:
        ids = await feed_get(user_id, 0, lim)
        if ids:
            oids = [PydanticObjectId(i) for i in ids]
            posts = await Post.find({"_id": {"$in": oids}, "isDeleted": False}).to_list()
            order = {str(oid): i for i, oid in enumerate(oids)}
            posts.sort(key=lambda p: order.get(str(p.id), 999))
            has_more = len(ids) >= lim
            return PaginatedPosts(
                data=await enrich_posts(posts, user_id),
                nextCursor=str(lim) if has_more else None,
                hasMore=has_more,
            )

    follows = await Follow.find(Follow.followerId == PydanticObjectId(user_id)).to_list()
    ids = [f.followingId for f in follows] + [PydanticObjectId(user_id)]
    q = Post.find({"authorId": {"$in": ids}, "isDeleted": False, "replyToId": None})
    if cursor and not cursor.isdigit():
        decoded = decode_cursor(cursor)
        if decoded:
            q = Post.find(
                {"authorId": {"$in": ids}, "isDeleted": False, "replyToId": None, "_id": {"$lt": decoded[1]}}
            )
    posts = await q.sort(-Post.id).skip(skip if cursor and cursor.isdigit() else 0).limit(lim + 1).to_list()
    has_more = len(posts) > lim
    slice_p = posts[:lim]
    last = slice_p[-1] if slice_p else None
    return PaginatedPosts(
        data=await enrich_posts(slice_p, user_id),
        nextCursor=str(skip + lim) if has_more and cursor and cursor.isdigit() else (str(last.id) if has_more and last else None),
        hasMore=has_more,
    )


@router.get("/for-you", response_model=PaginatedPosts)
async def feed_for_you(
    user_id: UserId,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
):
    """Keşif akışı: tüm gönderiler; ilgi alanı ve takip sıralamada yükselir."""
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    lim = parse_limit(limit)
    skip = int(cursor) if cursor else 0
    follows = await Follow.find(Follow.followerId == PydanticObjectId(user_id)).to_list()
    following_ids = [f.followingId for f in follows]
    orbit_ids = list(user.orbitIds or [])
    orbits = await load_interest_orbits(orbit_ids)
    orbit_slugs = [o.slug.lower() for o in orbits]
    since = for_you_since()

    pipeline = build_for_you_pipeline(
        user_id=user_id,
        orbit_ids=orbit_ids,
        orbit_slugs=orbit_slugs,
        following_ids=following_ids,
        since=since,
        skip=skip,
        limit=lim,
    )
    results = await aggregate_to_list(Post, pipeline, length=lim + 1)
    posts = []
    for r in results:
        strip_ranking_fields(r)
        posts.append(Post.model_validate(r))

    if not posts and skip == 0:
        fallback = (
            await Post.find(
                Post.isDeleted == False,
                Post.replyToId == None,
            )
            .sort(-Post.createdAt)
            .limit(lim + 1)
            .to_list()
        )
        posts = fallback

    has_more = len(posts) > lim
    slice_p = posts[:lim]
    return PaginatedPosts(
        data=await enrich_posts(slice_p, user_id),
        nextCursor=str(skip + lim) if has_more else None,
        hasMore=has_more,
    )


@router.get("/trending")
async def trending():
    if redis_ok():
        rows = await trending_top(10)
        if rows:
            return {"data": [{"tag": tag, "count": int(score)} for tag, score in rows]}

    since = datetime.utcnow() - timedelta(hours=24)
    pipeline = [
        {"$match": {"createdAt": {"$gte": since}, "isDeleted": False}},
        {"$unwind": "$hashtags"},
        {"$group": {"_id": "$hashtags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    rows = await aggregate_to_list(Post, pipeline)
    return {"data": [{"tag": r["_id"], "count": r["count"]} for r in rows]}


@router.get("/hashtag/{tag}", response_model=PaginatedPosts)
async def hashtag_feed(
    tag: str,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    viewer_id: OptionalUserId = None,
):
    lim = parse_limit(limit)
    q = Post.find(Post.hashtags == tag.lower(), Post.isDeleted == False)
    posts = await q.sort(-Post.id).limit(lim + 1).to_list()
    has_more = len(posts) > lim
    slice_p = posts[:lim]
    last = slice_p[-1] if slice_p else None
    return PaginatedPosts(
        data=await enrich_posts(slice_p, viewer_id),
        nextCursor=str(last.id) if has_more and last else None,
        hasMore=has_more,
    )
