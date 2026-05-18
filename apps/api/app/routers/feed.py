from datetime import datetime, timedelta

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query

from app.deps import OptionalUserId, UserId
from app.models.follow import Follow
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PaginatedPosts
from app.services.posts import enrich_posts
from app.utils import decode_cursor, encode_cursor, parse_limit

router = APIRouter()


@router.get("/following", response_model=PaginatedPosts)
async def feed_following(
    user_id: UserId,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
):
    lim = parse_limit(limit)
    follows = await Follow.find(Follow.followerId == PydanticObjectId(user_id)).to_list()
    ids = [f.followingId for f in follows] + [PydanticObjectId(user_id)]
    q = Post.find({"authorId": {"$in": ids}, "isDeleted": False, "replyToId": None})
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            q = Post.find(
                {"authorId": {"$in": ids}, "isDeleted": False, "replyToId": None, "_id": {"$lt": decoded[1]}}
            )
    posts = await q.sort(-Post.id).limit(lim + 1).to_list()
    has_more = len(posts) > lim
    slice_p = posts[:lim]
    last = slice_p[-1] if slice_p else None
    return PaginatedPosts(
        data=await enrich_posts(slice_p, user_id),
        nextCursor=str(last.id) if has_more and last else None,
        hasMore=has_more,
    )


@router.get("/for-you", response_model=PaginatedPosts)
async def feed_for_you(
    user_id: UserId,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    lim = parse_limit(limit)
    skip = int(cursor) if cursor else 0
    follows = await Follow.find(Follow.followerId == PydanticObjectId(user_id)).to_list()
    following_ids = [f.followingId for f in follows]
    orbit_ids = user.orbitIds or []
    since = datetime.utcnow() - timedelta(hours=48)

    pipeline = [
        {
            "$match": {
                "$or": [{"authorId": {"$in": following_ids}}, {"orbitId": {"$in": orbit_ids}}],
                "isDeleted": False,
                "createdAt": {"$gte": since},
            }
        },
        {
            "$addFields": {
                "engagementScore": {
                    "$add": [
                        {"$multiply": ["$stats.likeCount", 1]},
                        {"$multiply": ["$stats.replyCount", 2]},
                        {"$multiply": ["$stats.repostCount", 3]},
                        {"$multiply": ["$stats.bookmarkCount", 1.5]},
                    ]
                },
                "ageHours": {"$divide": [{"$subtract": [datetime.utcnow(), "$createdAt"]}, 3600000]},
            }
        },
        {
            "$addFields": {
                "nicheBoost": {"$cond": [{"$in": ["$orbitId", orbit_ids]}, 2, 1]},
            }
        },
        {
            "$addFields": {
                "finalScore": {
                    "$divide": [
                        {"$multiply": ["$engagementScore", "$nicheBoost"]},
                        {"$pow": [{"$add": ["$ageHours", 2]}, 1.5]},
                    ]
                }
            }
        },
        {"$sort": {"finalScore": -1, "createdAt": -1}},
        {"$skip": skip},
        {"$limit": lim + 1},
    ]
    results = await Post.aggregate(pipeline).to_list()
    posts = [Post.model_validate(r) for r in results]
    has_more = len(posts) > lim
    slice_p = posts[:lim]
    return PaginatedPosts(
        data=await enrich_posts(slice_p, user_id),
        nextCursor=str(skip + lim) if has_more else None,
        hasMore=has_more,
    )


@router.get("/trending")
async def trending():
    since = datetime.utcnow() - timedelta(hours=24)
    pipeline = [
        {"$match": {"createdAt": {"$gte": since}, "isDeleted": False}},
        {"$unwind": "$hashtags"},
        {"$group": {"_id": "$hashtags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    rows = await Post.aggregate(pipeline).to_list()
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
