import re

from beanie import PydanticObjectId

from app.models.bookmark import Bookmark
from app.models.like import Like
from app.models.orbit import Orbit
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PostOut
from app.services.serializers import post_out

HASHTAG_RE = re.compile(r"#[\w\u00C0-\u024F]+", re.UNICODE)
MENTION_RE = re.compile(r"@([\w]+)")


def extract_hashtags(content: str) -> list[str]:
    return list({t[1:].lower() for t in HASHTAG_RE.findall(content)})


def extract_mentions(content: str) -> list[str]:
    return list({m.lower() for m in MENTION_RE.findall(content)})


async def enrich_posts(posts: list[Post], viewer_id: str | None = None) -> list[PostOut]:
    if not posts:
        return []

    post_ids = [p.id for p in posts]
    author_ids = list({p.authorId for p in posts})
    orbit_ids = [p.orbitId for p in posts if p.orbitId]

    authors = await User.find({"_id": {"$in": author_ids}}).to_list()
    orbits = await Orbit.find({"_id": {"$in": orbit_ids}}).to_list() if orbit_ids else []

    likes: list[Like] = []
    bookmarks: list[Bookmark] = []
    if viewer_id:
        oid = PydanticObjectId(viewer_id)
        likes = await Like.find({"userId": oid, "postId": {"$in": post_ids}}).to_list()
        bookmarks = await Bookmark.find({"userId": oid, "postId": {"$in": post_ids}}).to_list()

    author_map = {a.id: a for a in authors}
    orbit_map = {o.id: o for o in orbits}
    liked = {str(l.postId) for l in likes}
    bookmarked = {str(b.postId) for b in bookmarks}

    result: list[PostOut] = []
    for p in posts:
        author = author_map.get(p.authorId)
        if not author:
            continue
        orbit = orbit_map.get(p.orbitId) if p.orbitId else None
        result.append(
            post_out(
                p,
                author,
                orbit,
                liked_by_me=str(p.id) in liked if viewer_id else None,
                bookmarked_by_me=str(p.id) in bookmarked if viewer_id else None,
                viewer_id=viewer_id,
            )
        )
    return result
