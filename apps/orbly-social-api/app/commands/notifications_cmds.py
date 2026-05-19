from __future__ import annotations

from typing import Any

from beanie import PydanticObjectId

from app.commands.registry import action
from app.errors import AppError
from app.models.notification import Notification


@action("notifications.readAll")
async def read_all(user_id: str | None, _data: dict[str, Any]) -> dict[str, Any]:
    oid = PydanticObjectId(user_id)
    async for n in Notification.find(Notification.userId == oid, Notification.isRead == False):
        n.isRead = True
        await n.save()
    return {"success": True}


@action("notifications.read")
async def read_one(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    notif_id = data.get("notificationId") or data.get("id")
    if not notif_id:
        raise AppError("notificationId required", 400)
    n = await Notification.find_one(
        Notification.id == PydanticObjectId(notif_id),
        Notification.userId == PydanticObjectId(user_id),
    )
    if n:
        n.isRead = True
        await n.save()
    return {"success": True}
