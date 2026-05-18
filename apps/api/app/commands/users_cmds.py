from __future__ import annotations

from typing import Any

from beanie import PydanticObjectId

from app.commands.json_util import to_jsonable
from app.commands.registry import action
from app.errors import AppError
from app.models.follow import Follow
from app.models.notification import Notification
from app.models.user import User
from app.schemas.users import UpdateProfileIn
from app.services.realtime_broadcast import broadcast_user_action
from app.services.serializers import user_out


@action("users.updateMe")
async def update_me(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = UpdateProfileIn.model_validate(data)
    user = await User.get(user_id)
    if not user:
        raise AppError("User not found", 404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    await user.save()
    return to_jsonable({"user": user_out(user)})


@action("users.follow")
async def follow(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    target_id = data.get("userId") or data.get("targetUserId")
    if not target_id:
        raise AppError("userId required", 400)
    if target_id == user_id:
        raise AppError("Cannot follow yourself", 400)
    target = await User.get(target_id)
    if not target:
        raise AppError("User not found", 404)
    oid = PydanticObjectId(user_id)
    tid = PydanticObjectId(target_id)
    if await Follow.find_one(Follow.followerId == oid, Follow.followingId == tid):
        return {"following": True}
    await Follow(followerId=oid, followingId=tid).insert()
    await User.find_one(User.id == oid).update({"$inc": {"stats.followingCount": 1}})
    await User.find_one(User.id == tid).update({"$inc": {"stats.followersCount": 1}})
    await Notification(userId=tid, actorId=oid, type="follow").insert()
    actor = await User.get(user_id)
    await broadcast_user_action(
        target_id,
        action="follow",
        actor_id=user_id,
        payload={
            "following": True,
            "actor": user_out(actor).model_dump(mode="json") if actor else None,
        },
    )
    return {"following": True}


@action("users.unfollow")
async def unfollow(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    target_id = data.get("userId") or data.get("targetUserId")
    if not target_id:
        raise AppError("userId required", 400)
    oid, tid = PydanticObjectId(user_id), PydanticObjectId(target_id)
    removed = await Follow.find_one(Follow.followerId == oid, Follow.followingId == tid)
    if removed:
        await removed.delete()
        await User.find_one(User.id == oid).update({"$inc": {"stats.followingCount": -1}})
        await User.find_one(User.id == tid).update({"$inc": {"stats.followersCount": -1}})
    await broadcast_user_action(
        target_id,
        action="unfollow",
        actor_id=user_id,
        payload={"following": False},
    )
    return {"following": False}
