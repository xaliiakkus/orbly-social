from __future__ import annotations

import logging
from typing import Any

import socketio

from app.config import settings
from app.services.auth_tokens import decode_token

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

_user_rooms: dict[str, str] = {}


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None) -> bool:
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")
    if not token:
        qs = environ.get("QUERY_STRING", "")
        for part in qs.split("&"):
            if part.startswith("token="):
                token = part.split("=", 1)[1]
    if not token:
        return False
    try:
        user_id = decode_token(token, "access")
    except ValueError:
        return False
    room = f"user:{user_id}"
    await sio.enter_room(sid, room)
    _user_rooms[sid] = room
    return True


@sio.event
async def disconnect(sid: str) -> None:
    _user_rooms.pop(sid, None)


async def emit_to_user(user_id: str, event: str, data: dict[str, Any]) -> None:
    await sio.emit(event, data, room=f"user:{user_id}")


async def emit_notification(user_id: str, payload: dict[str, Any]) -> None:
    await emit_to_user(user_id, "notification", payload)


async def emit_message(user_id: str, payload: dict[str, Any]) -> None:
    await emit_to_user(user_id, "message", payload)


async def emit_feed_update(user_id: str, payload: dict[str, Any]) -> None:
    await emit_to_user(user_id, "feed:new", payload)


def mount_socketio(app):  # noqa: ANN001
    return socketio.ASGIApp(sio, other_asgi_app=app, socketio_path=settings.socket_path.strip("/"))
