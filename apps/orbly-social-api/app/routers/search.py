from fastapi import APIRouter, Query

from app.models.orbit import Orbit
from app.models.post import Post
from app.models.user import User
from app.services.posts import enrich_posts
from app.services.serializers import orbit_out, user_out
from app.utils import parse_limit

router = APIRouter()


@router.get("/")
async def search(
    q: str = Query(min_length=1, max_length=100),
    type: str = Query("all", pattern="^(all|users|posts|orbits)$"),
    limit: int = Query(10, ge=1, le=30),
):
    lim = parse_limit(limit)
    regex = {"$regex": q, "$options": "i"}
    result: dict = {"users": [], "posts": [], "orbits": []}

    if type in ("all", "users"):
        users = await User.find(
            {
                "isBanned": False,
                "$or": [
                    {"username": regex},
                    {"displayName": regex},
                ],
            }
        ).limit(lim).to_list()
        result["users"] = [user_out(u) for u in users]

    if type in ("all", "orbits"):
        orbits = await Orbit.find(
            {"$or": [{"name": regex}, {"slug": regex}, {"description": regex}]}
        ).limit(lim).to_list()
        result["orbits"] = [orbit_out(o) for o in orbits]

    if type in ("all", "posts"):
        posts = await Post.find(
            {"isDeleted": False, "content": regex}
        ).sort(-Post.id).limit(lim).to_list()
        result["posts"] = await enrich_posts(posts, None)

    return {"query": q, **result}
