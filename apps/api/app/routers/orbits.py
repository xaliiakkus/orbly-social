import re

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.deps import OptionalUserId, UserId
from app.models.orbit import Orbit
from app.models.post import Post
from app.models.user import User
from app.schemas.common import PaginatedPosts
from app.services.posts import enrich_posts
from app.services.serializers import orbit_out
from app.utils import parse_limit

router = APIRouter()
SLUG_RE = re.compile(r"^[a-z0-9-]+$")


class CreateOrbitIn(BaseModel):
    slug: str = Field(min_length=2, max_length=50, examples=["tech"])
    name: str = Field(max_length=100, examples=["Tech"])
    description: str | None = Field(None, max_length=500)
    iconUrl: str | None = None
    bannerUrl: str | None = None


class UpdateOrbitIn(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    iconUrl: str | None = None
    bannerUrl: str | None = None


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


@router.post("/", status_code=201)
async def create_orbit(body: CreateOrbitIn, user_id: UserId):
    slug = body.slug.lower()
    if not SLUG_RE.match(slug):
        raise HTTPException(400, "Invalid slug")
    if await Orbit.find_one(Orbit.slug == slug):
        raise HTTPException(409, "Orbit slug already taken")
    orbit = Orbit(
        slug=slug,
        name=body.name,
        description=body.description,
        iconUrl=body.iconUrl,
        bannerUrl=body.bannerUrl,
        createdBy=PydanticObjectId(user_id),
    )
    await orbit.insert()
    return {"orbit": orbit_out(orbit)}


@router.get("/{slug}")
async def get_orbit(slug: str):
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise HTTPException(404, "Orbit not found")
    return {"orbit": orbit_out(orbit)}


@router.patch("/{slug}")
async def update_orbit(slug: str, body: UpdateOrbitIn, user_id: UserId):
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise HTTPException(404, "Orbit not found")
    user = await User.get(user_id)
    if str(orbit.createdBy) != user_id and (not user or user.role != "admin"):
        raise HTTPException(403, "Forbidden")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(orbit, k, v)
    await orbit.save()
    return {"orbit": orbit_out(orbit)}


@router.post("/{slug}/join", status_code=201)
async def join_orbit(slug: str, user_id: UserId):
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise HTTPException(404, "Orbit not found")
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if orbit.id not in (user.orbitIds or []):
        user.orbitIds = list(user.orbitIds or []) + [orbit.id]
        await user.save()
        await Orbit.find_one(Orbit.id == orbit.id).update({"$inc": {"stats.memberCount": 1}})
    return {"joined": True}


@router.delete("/{slug}/join")
async def leave_orbit(slug: str, user_id: UserId):
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise HTTPException(404, "Orbit not found")
    user = await User.get(user_id)
    if user and orbit.id in (user.orbitIds or []):
        user.orbitIds = [x for x in user.orbitIds if x != orbit.id]
        await user.save()
        await Orbit.find_one(Orbit.id == orbit.id).update({"$inc": {"stats.memberCount": -1}})
    return {"joined": False}


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
