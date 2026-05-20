from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query

from app.commands.posts_cmds import delete_post, update_post
from app.deps import OptionalUserId, UserId
from app.models.post import Post
from app.schemas.common import PaginatedPosts, PaginatedUsers
from app.schemas.posts import UpdatePostIn
from app.services.post_thread import list_thread_replies
from app.services.posts import enrich_posts, list_post_reposters
from app.utils import decode_cursor, encode_cursor, parse_limit

router = APIRouter()


@router.patch("/{post_id}")
async def patch_post(post_id: str, body: UpdatePostIn, user_id: UserId):
    """REST fallback when socket RPC is unavailable."""
    return await update_post(user_id, {"postId": post_id, **body.model_dump()})


@router.delete("/{post_id}")
async def remove_post(post_id: str, user_id: UserId):
    """REST fallback when socket RPC is unavailable."""
    return await delete_post(user_id, {"postId": post_id})


@router.get("/{post_id}")
async def get_post(post_id: str, viewer_id: OptionalUserId = None):
    post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not post:
        raise HTTPException(404, "Post not found")
    enriched = await enrich_posts([post], viewer_id)
    return {"post": enriched[0]}


@router.get("/{post_id}/reposts", response_model=PaginatedUsers)
async def post_reposters(
    post_id: str,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
):
    return await list_post_reposters(post_id, cursor=cursor, limit=limit)


@router.get("/{post_id}/replies", response_model=PaginatedPosts)
async def replies(
    post_id: str,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    viewer_id: OptionalUserId = None,
):
    lim = parse_limit(limit)
    slice_p = await list_thread_replies(post_id, limit=lim + 1)
    has_more = len(slice_p) > lim
    slice_p = slice_p[:lim]
    return PaginatedPosts(
        data=await enrich_posts(slice_p, viewer_id),
        nextCursor=str(slice_p[-1].id) if has_more and slice_p else None,
        hasMore=has_more,
    )
