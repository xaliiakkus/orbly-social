from __future__ import annotations

from typing import Any

from beanie import PydanticObjectId

from app.commands.registry import action
from app.errors import AppError
from app.models.bookmark import Bookmark
from app.models.post import Post


@action("bookmarks.add")
async def add_bookmark(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    post = await Post.find_one(Post.id == PydanticObjectId(post_id), Post.isDeleted == False)
    if not post:
        raise AppError("Post not found", 404)
    oid, pid = PydanticObjectId(user_id), PydanticObjectId(post_id)
    if await Bookmark.find_one(Bookmark.userId == oid, Bookmark.postId == pid):
        return {"bookmarked": True}
    await Bookmark(userId=oid, postId=pid).insert()
    await Post.find_one(Post.id == pid).update({"$inc": {"stats.bookmarkCount": 1}})
    return {"bookmarked": True}


@action("bookmarks.remove")
async def remove_bookmark(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    post_id = data.get("postId") or data.get("id")
    if not post_id:
        raise AppError("postId required", 400)
    oid, pid = PydanticObjectId(user_id), PydanticObjectId(post_id)
    bm = await Bookmark.find_one(Bookmark.userId == oid, Bookmark.postId == pid)
    if bm:
        await bm.delete()
        await Post.find_one(Post.id == pid).update({"$inc": {"stats.bookmarkCount": -1}})
    return {"bookmarked": False}
