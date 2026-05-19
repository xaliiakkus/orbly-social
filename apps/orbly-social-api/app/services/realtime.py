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

_sid_users: dict[str, str | None] = {}


def get_sid_user_id(sid: str) -> str | None:
    return _sid_users.get(sid)


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
    user_id: str | None = None
    if token:
        try:
            user_id = decode_token(token, "access")
        except ValueError:
            return False
        await sio.enter_room(sid, f"user:{user_id}")
    _sid_users[sid] = user_id
    return True


@sio.event
async def disconnect(sid: str) -> None:
    _sid_users.pop(sid, None)


async def emit_to_user(user_id: str, event: str, data: dict[str, Any]) -> None:
    await sio.emit(event, data, room=f"user:{user_id}")


async def emit_notification(user_id: str, payload: dict[str, Any]) -> None:
    await emit_to_user(user_id, "notification", payload)


async def emit_message(user_id: str, payload: dict[str, Any]) -> None:
    await emit_to_user(user_id, "message", payload)


async def emit_feed_update(user_id: str, payload: dict[str, Any]) -> None:
    await emit_to_user(user_id, "feed:new", payload)


def mount_socketio(fastapi_app):  # noqa: ANN001
    # Do not name the parameter `app`: `import app.commands` would shadow it and
    # pass the package module to ASGIApp (TypeError: 'module' object is not callable).
    import app.commands  # noqa: F401
    import app.services.socket_rpc  # noqa: F401
    import app.services.socket_subscribe  # noqa: F401

    return socketio.ASGIApp(
        sio,
        other_asgi_app=fastapi_app,
        socketio_path=settings.socket_path.strip("/"),
    )
