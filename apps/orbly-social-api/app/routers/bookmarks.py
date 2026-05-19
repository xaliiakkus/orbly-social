from beanie import PydanticObjectId
from fastapi import APIRouter, Query

from app.deps import UserId
from app.models.bookmark import Bookmark
from app.models.post import Post
from app.schemas.common import PaginatedPosts
from app.services.posts import enrich_posts
from app.utils import parse_limit

router = APIRouter()


@router.get("/", response_model=PaginatedPosts)
async def list_bookmarks(
    user_id: UserId,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
):
    lim = parse_limit(limit)
    oid = PydanticObjectId(user_id)
    q = Bookmark.find(Bookmark.userId == oid)
    if cursor:
        q = Bookmark.find(Bookmark.userId == oid, Bookmark.id < PydanticObjectId(cursor))
    bookmarks = await q.sort(-Bookmark.id).limit(lim + 1).to_list()
    has_more = len(bookmarks) > lim
    slice_b = bookmarks[:lim]
    post_ids = [b.postId for b in slice_b]
    posts = await Post.find({"_id": {"$in": post_ids}, "isDeleted": False}).to_list()
    pmap = {p.id: p for p in posts}
    ordered = [pmap[b.postId] for b in slice_b if b.postId in pmap]
    last = slice_b[-1] if slice_b else None
    return PaginatedPosts(
        data=await enrich_posts(ordered, user_id),
        nextCursor=str(last.id) if has_more and last else None,
        hasMore=has_more,
    )
