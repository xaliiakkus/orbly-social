from __future__ import annotations

import logging
from typing import Any

from app.commands.json_util import to_jsonable
from app.commands.registry import dispatch
from app.errors import AppError
from app.services.realtime import get_sid_user_id, sio

logger = logging.getLogger(__name__)


@sio.on("rpc")
async def handle_rpc(sid: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Socket RPC — return value is sent to the client as the ack response."""
    if not payload or not isinstance(payload, dict):
        return {"ok": False, "error": "Invalid payload", "status": 400}
    action = payload.get("action")
    if not action or not isinstance(action, str):
        return {"ok": False, "error": "action required", "status": 400}
    data = payload.get("data")
    if data is None:
        data = {}
    if not isinstance(data, dict):
        return {"ok": False, "error": "data must be an object", "status": 400}

    user_id = get_sid_user_id(sid)
    try:
        result = await dispatch(action, user_id, data)
        return {"ok": True, "data": to_jsonable(result)}
    except AppError as exc:
        return {"ok": False, "error": exc.message, "status": exc.status}
    except Exception:
        logger.exception("rpc %s failed for sid=%s", action, sid)
        return {"ok": False, "error": "Internal server error", "status": 500}
