from __future__ import annotations

from typing import Any

from beanie import PydanticObjectId

from app.commands.json_util import to_jsonable
from app.commands.registry import action
from app.errors import AppError
from app.models.orbit import Orbit
from app.models.user import User
from app.schemas.orbits import SLUG_RE, CreateOrbitIn, UpdateOrbitIn
from app.services.serializers import orbit_out


@action("orbits.create")
async def create_orbit(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = CreateOrbitIn.model_validate(data)
    slug = body.slug.lower()
    if not SLUG_RE.match(slug):
        raise AppError("Invalid slug", 400)
    if await Orbit.find_one(Orbit.slug == slug):
        raise AppError("Orbit slug already taken", 409)
    orbit = Orbit(
        slug=slug,
        name=body.name,
        description=body.description,
        iconUrl=body.iconUrl,
        bannerUrl=body.bannerUrl,
        createdBy=PydanticObjectId(user_id),
    )
    await orbit.insert()
    return to_jsonable({"orbit": orbit_out(orbit)})


@action("orbits.update")
async def update_orbit(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    slug = data.get("slug")
    if not slug:
        raise AppError("slug required", 400)
    body = UpdateOrbitIn.model_validate({k: v for k, v in data.items() if k != "slug"})
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise AppError("Orbit not found", 404)
    user = await User.get(user_id)
    if str(orbit.createdBy) != user_id and (not user or user.role != "admin"):
        raise AppError("Forbidden", 403)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(orbit, k, v)
    await orbit.save()
    return to_jsonable({"orbit": orbit_out(orbit)})


@action("orbits.join")
async def join_orbit(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    slug = data.get("slug")
    if not slug:
        raise AppError("slug required", 400)
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise AppError("Orbit not found", 404)
    user = await User.get(user_id)
    if not user:
        raise AppError("User not found", 404)
    if orbit.id not in (user.orbitIds or []):
        user.orbitIds = list(user.orbitIds or []) + [orbit.id]
        await user.save()
        await Orbit.find_one(Orbit.id == orbit.id).update({"$inc": {"stats.memberCount": 1}})
    return {"joined": True}


@action("orbits.leave")
async def leave_orbit(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    slug = data.get("slug")
    if not slug:
        raise AppError("slug required", 400)
    orbit = await Orbit.find_one(Orbit.slug == slug.lower())
    if not orbit:
        raise AppError("Orbit not found", 404)
    user = await User.get(user_id)
    if user and orbit.id in (user.orbitIds or []):
        user.orbitIds = [x for x in user.orbitIds if x != orbit.id]
        await user.save()
        await Orbit.find_one(Orbit.id == orbit.id).update({"$inc": {"stats.memberCount": -1}})
    return {"joined": False}
