from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query

from app.commands.posts_cmds import delete_post, update_post
from app.deps import OptionalUserId, UserId
from app.models.post import Post
from app.schemas.common import PaginatedPosts
from app.schemas.posts import UpdatePostIn
from app.services.posts import enrich_posts
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
