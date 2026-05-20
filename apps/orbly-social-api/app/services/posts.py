import re

from beanie import PydanticObjectId

from app.models.bookmark import Bookmark
from app.models.like import Like
from app.models.orbit import Orbit
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PaginatedUsers, PostOut
from app.services.serializers import post_out, user_out
from app.utils import decode_cursor, encode_cursor, parse_limit

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
    embed_ids = [p.repostOfId for p in posts if p.repostOfId]

    authors = await User.find({"_id": {"$in": author_ids}}).to_list()
    embed_posts: list[Post] = []
    if embed_ids:
        embed_posts = await Post.find(
            {"_id": {"$in": embed_ids}, "isDeleted": False}
        ).to_list()
        for ep in embed_posts:
            author_ids.append(ep.authorId)
            if ep.orbitId:
                orbit_ids.append(ep.orbitId)

    authors = await User.find({"_id": {"$in": list(set(author_ids))}}).to_list()
    orbits = (
        await Orbit.find({"_id": {"$in": list(set(orbit_ids))}}).to_list()
        if orbit_ids
        else []
    )

    likes: list[Like] = []
    bookmarks: list[Bookmark] = []
    my_reposts: list[Post] = []
    if viewer_id:
        oid = PydanticObjectId(viewer_id)
        likes = await Like.find({"userId": oid, "postId": {"$in": post_ids}}).to_list()
        bookmarks = await Bookmark.find(
            {"userId": oid, "postId": {"$in": post_ids}}
        ).to_list()
        repost_targets = list(
            {p.repostOfId for p in posts if p.repostOfId}
            | {p.id for p in posts}
        )
        my_reposts = await Post.find(
            {
                "authorId": oid,
                "repostOfId": {"$in": list(repost_targets)},
                "isDeleted": False,
            }
        ).to_list()

    author_map = {a.id: a for a in authors}
    orbit_map = {o.id: o for o in orbits}
    embed_map = {p.id: p for p in embed_posts}
    liked = {str(l.postId) for l in likes}
    bookmarked = {str(b.postId) for b in bookmarks}
    repost_by_target: dict[str, str] = {
        str(r.repostOfId): str(r.id) for r in my_reposts if r.repostOfId
    }

    result: list[PostOut] = []
    for p in posts:
        author = author_map.get(p.authorId)
        if not author:
            continue
        orbit = orbit_map.get(p.orbitId) if p.orbitId else None

        repost_of_out: PostOut | None = None
        if p.repostOfId and p.repostOfId in embed_map:
            ep = embed_map[p.repostOfId]
            ea = author_map.get(ep.authorId)
            if ea:
                eo = orbit_map.get(ep.orbitId) if ep.orbitId else None
                repost_of_out = post_out(ep, ea, eo, viewer_id=viewer_id)

        repost_target_id = p.repostOfId if p.repostOfId else p.id
        my_repost_id = repost_by_target.get(str(repost_target_id))
        reposted_by_me = my_repost_id is not None

        result.append(
            post_out(
                p,
                author,
                orbit,
                liked_by_me=str(p.id) in liked if viewer_id else None,
                bookmarked_by_me=str(p.id) in bookmarked if viewer_id else None,
                repost_of=repost_of_out,
                reposted_by_me=reposted_by_me if viewer_id else None,
                my_repost_id=my_repost_id,
                viewer_id=viewer_id,
            )
        )
    return result


async def resolve_repost_target_id(post_id: str) -> PydanticObjectId | None:
    """Rewet kartı id'si gelse bile kök gönderi id'sine in."""
    try:
        oid = PydanticObjectId(post_id)
    except Exception:
        return None
    post = await Post.find_one(Post.id == oid, Post.isDeleted == False)
    if not post:
        return None
    if post.repostOfId and not (post.content or "").strip():
        root = await Post.find_one(Post.id == post.repostOfId, Post.isDeleted == False)
        if root:
            return root.id
    return post.id


async def list_post_reposters(
    post_id: str,
    cursor: str | None = None,
    limit: int = 20,
) -> PaginatedUsers:
    target_id = await resolve_repost_target_id(post_id)
    if not target_id:
        return PaginatedUsers(data=[], nextCursor=None, hasMore=False)

    lim = parse_limit(limit)
    query: dict = {"repostOfId": target_id, "isDeleted": False}
    decoded = decode_cursor(cursor) if cursor else None
    if decoded:
        ca, cid = decoded
        query["$or"] = [
            {"createdAt": {"$lt": ca}},
            {"createdAt": ca, "_id": {"$lt": cid}},
        ]

    reposts = (
        await Post.find(query).sort(-Post.createdAt).limit(lim + 1).to_list()
    )
    has_more = len(reposts) > lim
    slice_p = reposts[:lim]

    seen: set[str] = set()
    author_ids: list[PydanticObjectId] = []
    for p in slice_p:
        aid = str(p.authorId)
        if aid in seen:
            continue
        seen.add(aid)
        author_ids.append(p.authorId)

    users = await User.find({"_id": {"$in": author_ids}}).to_list()
    umap = {u.id: u for u in users}
    data = [user_out(umap[i]) for i in author_ids if i in umap]

    last = slice_p[-1] if slice_p else None
    nc = (
        encode_cursor(last.createdAt, last.id)
        if has_more and last and last.createdAt
        else None
    )
    return PaginatedUsers(data=data, nextCursor=nc, hasMore=has_more)
