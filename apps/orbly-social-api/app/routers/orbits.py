from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query

from app.deps import OptionalUserId
from app.models.orbit import Orbit
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PaginatedPosts
from app.services.posts import enrich_posts
from app.services.serializers import orbit_out
from app.utils import parse_limit

router = APIRouter()


@router.get("")
@router.get("/")
async def list_orbits(q: str | None = None, limit: int = Query(20, ge=1, le=50)):
    lim = parse_limit(limit)
    if q:
        orbits = await Orbit.find(
            {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"slug": {"$regex": q, "$options": "i"}}]}
        ).limit(lim).to_list()
    else:
        orbits = await Orbit.find_all().sort(-Orbit.stats.memberCount).limit(lim).to_list()
    return {"data": [orbit_out(o) for o in orbits]}


@router.get("/{slug}")
async def get_orbit(slug: str, viewer_id: OptionalUserId = None):
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise HTTPException(404, "Orbit not found")
    is_member = False
    if viewer_id:
        user = await User.get(viewer_id)
        is_member = user is not None and orbit.id in (user.orbitIds or [])
    return {"orbit": orbit_out(orbit), "isMember": is_member}


@router.get("/{slug}/posts", response_model=PaginatedPosts)
async def orbit_posts(
    slug: str,
    cursor: str | None = None,
    limit: int = Query(20, ge=1, le=50),
    viewer_id: OptionalUserId = None,
):
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise HTTPException(404, "Orbit not found")
    lim = parse_limit(limit)
    q = Post.find(Post.orbitId == orbit.id, Post.isDeleted == False)
    if cursor:
        q = Post.find(
            Post.orbitId == orbit.id,
            Post.isDeleted == False,
            Post.id < PydanticObjectId(cursor),
        )
    posts = await q.sort(-Post.id).limit(lim + 1).to_list()
    has_more = len(posts) > lim
    slice_p = posts[:lim]
    last = slice_p[-1] if slice_p else None
    return PaginatedPosts(
        data=await enrich_posts(slice_p, viewer_id),
        nextCursor=str(last.id) if has_more and last else None,
        hasMore=has_more,
    )
