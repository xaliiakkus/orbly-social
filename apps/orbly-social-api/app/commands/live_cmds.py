from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from beanie import PydanticObjectId

from app.commands.json_util import to_jsonable
from app.commands.registry import action
from app.errors import AppError
from app.models.live_channel import MAX_MODERATORS, MAX_SPACE_SPEAKERS, LiveChannel
from app.models.live_comment import LiveComment
from app.models.post import Post
from app.models.user import User
from app.services.livekit_egress import start_room_recording, stop_room_recording
from app.services.livekit_tokens import create_room_token, livekit_configured
from app.services.live_replay import try_finalize_egress
from app.services.realtime import sio
from app.services.redis_client import live_presence_join, live_presence_leave, redis_ok
from app.services.serializers import user_out


def live_room(channel_id: str) -> str:
    return f"live:{channel_id}"


async def _broadcast_channel(event: str, channel_id: str, payload: dict[str, Any]) -> None:
    await sio.emit(event, payload, room=live_room(channel_id))


def _bump_peak(ch: LiveChannel, count: int) -> None:
    if count > ch.peakListenerCount:
        ch.peakListenerCount = count


def _duration_seconds(ch: LiveChannel) -> int:
    end = ch.endedAt or datetime.utcnow()
    return max(0, int((end - ch.startedAt).total_seconds()))


def _format_duration(seconds: int) -> str:
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h > 0:
        return f"{h} sa {m} dk"
    if m > 0:
        return f"{m} dk {s} sn"
    return f"{s} sn"


def _oid(user_id: str) -> PydanticObjectId:
    return PydanticObjectId(user_id)


def _is_host(ch: LiveChannel, user_id: str) -> bool:
    return str(ch.hostId) == user_id


def _is_speaker(ch: LiveChannel, user_id: str) -> bool:
    uid = _oid(user_id)
    return uid in ch.speakerIds


def _is_moderator(ch: LiveChannel, user_id: str) -> bool:
    return _oid(user_id) in (ch.moderatorIds or [])


def _can_manage_room(ch: LiveChannel, user_id: str) -> bool:
    return _is_host(ch, user_id) or _is_moderator(ch, user_id)


def _can_publish(ch: LiveChannel, user_id: str) -> bool:
    if _is_host(ch, user_id):
        return True
    if ch.kind == "space" and _is_speaker(ch, user_id):
        return True
    return False


def _publish_sources(ch: LiveChannel, user_id: str) -> list[str] | None:
    if not _can_publish(ch, user_id):
        return None
    if ch.kind == "space":
        return ["microphone"]
    return ["microphone", "camera", "screen_share"]


def _role(ch: LiveChannel, user_id: str) -> str:
    if _is_host(ch, user_id):
        return "host"
    if _is_moderator(ch, user_id):
        return "moderator"
    if _is_speaker(ch, user_id):
        return "speaker"
    return "listener"


async def _register_listener_presence(ch: LiveChannel, user_id: str) -> bool:
    """İzleyici zaten sayıldıysa False — tekrar token alınca sayaç artmaz."""
    if _is_host(ch, user_id) or _is_speaker(ch, user_id):
        return False
    uid = _oid(user_id)
    cid = str(ch.id)
    if redis_ok():
        return await live_presence_join(cid, user_id)
    ids = list(ch.presenceIds or [])
    if uid in ids:
        return False
    ch.presenceIds = ids + [uid]
    return True


async def _clear_listener_presence(ch: LiveChannel, user_id: str) -> bool:
    """Odadan çıkış; presence vardıysa True."""
    if _is_host(ch, user_id):
        return False
    uid = _oid(user_id)
    cid = str(ch.id)
    if redis_ok():
        return await live_presence_leave(cid, user_id)
    ids = list(ch.presenceIds or [])
    if uid not in ids:
        return False
    ch.presenceIds = [x for x in ids if x != uid]
    return True


async def _load_users_map(user_ids: list[PydanticObjectId]) -> dict[PydanticObjectId, User]:
    if not user_ids:
        return {}
    users = await User.find({"_id": {"$in": user_ids}}).to_list()
    return {u.id: u for u in users}


async def _speakers_payload(ch: LiveChannel) -> list[dict[str, Any]]:
    ids = [ch.hostId, *ch.speakerIds]
    umap = await _load_users_map(ids)
    out: list[dict[str, Any]] = []
    host = umap.get(ch.hostId)
    if host:
        out.append(
            {
                "userId": str(host.id),
                "role": "host",
                "user": user_out(host).model_dump(mode="json"),
            }
        )
    for sid in ch.speakerIds:
        if sid == ch.hostId:
            continue
        u = umap.get(sid)
        if u:
            role = "moderator" if sid in (ch.moderatorIds or []) else "speaker"
            out.append(
                {
                    "userId": str(u.id),
                    "role": role,
                    "user": user_out(u).model_dump(mode="json"),
                }
            )
    return out


async def _requests_payload(ch: LiveChannel) -> list[dict[str, Any]]:
    umap = await _load_users_map(ch.speakerRequestIds)
    return [
        {
            "userId": str(uid),
            "user": user_out(umap[uid]).model_dump(mode="json"),
        }
        for uid in ch.speakerRequestIds
        if uid in umap
    ]


async def _stats_out(ch: LiveChannel, host: User | None = None) -> dict[str, Any]:
    if host is None:
        host = await User.get(ch.hostId)
    duration = _duration_seconds(ch)
    return {
        "channelId": str(ch.id),
        "title": ch.title,
        "kind": ch.kind,
        "mode": ch.mode,
        "status": ch.status,
        "durationSeconds": duration,
        "durationLabel": _format_duration(duration),
        "peakListeners": ch.peakListenerCount,
        "totalComments": ch.commentCount,
        "currentListeners": ch.listenerCount,
        "speakerCount": len(ch.speakerIds) + 1,
        "startedAt": ch.startedAt.isoformat() + "Z",
        "endedAt": ch.endedAt.isoformat() + "Z" if ch.endedAt else None,
        "replayPostId": str(ch.replayPostId) if ch.replayPostId else None,
        "replayUrl": ch.replayUrl,
        "hasReplayVideo": bool(ch.replayUrl),
        "recordingStatus": ch.recordingStatus,
        "host": user_out(host).model_dump(mode="json") if host else None,
    }


async def _channel_out(
    ch: LiveChannel,
    host: User | None = None,
    viewer_id: str | None = None,
) -> dict[str, Any]:
    base = await _stats_out(ch, host)
    speakers = await _speakers_payload(ch)
    my_role = _role(ch, viewer_id) if viewer_id else None
    has_requested = (
        viewer_id is not None and _oid(viewer_id) in ch.speakerRequestIds
    )
    out: dict[str, Any] = {
        "id": base["channelId"],
        "title": base["title"],
        "kind": ch.kind,
        "mode": base["mode"],
        "status": base["status"],
        "orbitId": str(ch.orbitId) if ch.orbitId else None,
        "listenerCount": ch.listenerCount,
        "peakListenerCount": ch.peakListenerCount,
        "commentCount": ch.commentCount,
        "replayPostId": base["replayPostId"],
        "hasReplayVideo": base["hasReplayVideo"],
        "startedAt": base["startedAt"],
        "endedAt": base["endedAt"],
        "host": base["host"],
        "speakers": speakers,
        "speakerCount": len(speakers),
        "maxSpeakers": MAX_SPACE_SPEAKERS,
        "myRole": my_role,
        "hasSpeakRequest": has_requested,
        "isHost": _is_host(ch, viewer_id) if viewer_id else False,
        "canManageRoom": _can_manage_room(ch, viewer_id) if viewer_id else False,
    }
    if viewer_id and _can_manage_room(ch, viewer_id):
        out["speakerRequests"] = await _requests_payload(ch)
    return out


async def _emit_speakers_update(ch: LiveChannel, channel_id: str) -> None:
    speakers = await _speakers_payload(ch)
    await _broadcast_channel(
        "channel:speakers",
        channel_id,
        {
            "channelId": channel_id,
            "speakers": speakers,
            "speakerRequests": await _requests_payload(ch),
            "speakerCount": len(speakers),
        },
    )
    await _broadcast_channel(
        "channel:update",
        channel_id,
        {
            "id": channel_id,
            "listenerCount": ch.listenerCount,
            "speakerCount": len(speakers),
            "commentCount": ch.commentCount,
        },
    )


def _ensure_space(ch: LiveChannel) -> None:
    if ch.kind != "space":
        raise AppError("Bu işlem yalnızca sohbet odaları için geçerli", 400)


def _ensure_host(ch: LiveChannel, user_id: str) -> None:
    if not _is_host(ch, user_id):
        raise AppError("Yalnızca oda sahibi bu işlemi yapabilir", 403)


def _ensure_room_manager(ch: LiveChannel, user_id: str) -> None:
    if not _can_manage_room(ch, user_id):
        raise AppError("Bu işlem için oda yönetimi gerekir", 403)


def _speaker_slots_left(ch: LiveChannel) -> int:
    return max(0, MAX_SPACE_SPEAKERS - len(ch.speakerIds))


async def _add_speaker(ch: LiveChannel, target_id: PydanticObjectId) -> None:
    if target_id == ch.hostId:
        return
    if target_id in ch.speakerIds:
        return
    if _speaker_slots_left(ch) <= 0:
        raise AppError(f"En fazla {MAX_SPACE_SPEAKERS} konuşmacı olabilir", 409)
    ch.speakerIds.append(target_id)
    if target_id in ch.speakerRequestIds:
        ch.speakerRequestIds = [x for x in ch.speakerRequestIds if x != target_id]


@action("live.start")
async def start_live(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    if not livekit_configured():
        raise AppError("Canlı yayın şu an kullanılamıyor", 422)

    title = (data.get("title") or "Canlı yayın").strip()[:120]
    kind = data.get("kind") or "broadcast"
    if kind not in ("broadcast", "space"):
        raise AppError("kind must be broadcast or space", 400)

    mode = data.get("mode") or ("audio" if kind == "space" else "video")
    if kind == "space":
        mode = "audio"
    if mode not in ("audio", "video"):
        raise AppError("mode must be audio or video", 400)

    existing = await LiveChannel.find_one(
        LiveChannel.hostId == PydanticObjectId(user_id),
        LiveChannel.status == "live",
    )
    if existing:
        raise AppError("Zaten canlı bir odadasın", 409)

    orbit_id = data.get("orbitId")
    room_id = f"orbly-{uuid.uuid4().hex[:12]}"
    ch = LiveChannel(
        hostId=PydanticObjectId(user_id),
        title=title,
        orbitId=PydanticObjectId(orbit_id) if orbit_id else None,
        kind=kind,
        mode=mode,
        livekitRoom=room_id,
        listenerCount=0,
    )
    await ch.insert()

    if kind == "broadcast":
        egress_id = await start_room_recording(room_name=room_id, channel_id=str(ch.id))
        if egress_id:
            ch.egressId = egress_id
            ch.recordingStatus = "recording"
            await ch.save()

    host = await User.get(user_id)
    out = await _channel_out(ch, host, viewer_id=user_id)
    await _broadcast_channel("channel:live", str(ch.id), out)
    await sio.emit("live:started", out)

    try:
        token = create_room_token(
            room_name=room_id,
            identity=str(user_id),
            name=host.displayName if host else "Host",
            can_publish=True,
            can_publish_sources=_publish_sources(ch, user_id),
        )
    except Exception as exc:
        await ch.delete()
        raise AppError("Oda başlatılamadı", 422) from exc
    return to_jsonable(
        {
            "channel": out,
            "livekit": {
                "url": settings_livekit_url(),
                "token": token,
                "roomName": room_id,
                "role": "host",
            },
        }
    )


def settings_livekit_url() -> str:
    from app.config import settings

    return settings.livekit_url.rstrip("/")


async def _create_recap_post(ch: LiveChannel, host: User) -> Post:
    duration = _format_duration(_duration_seconds(ch))
    if ch.kind == "space":
        content = (
            f"🎙️ {ch.title}\n\n"
            f"Herkese açık sohbet odası · {duration} · "
            f"{ch.peakListenerCount} tepe dinleyici · {ch.commentCount} mesaj"
        )
    else:
        mode_label = "Görüntülü" if ch.mode == "video" else "Sesli"
        content = (
            f"📺 {ch.title}\n\n"
            f"{mode_label} canlı yayın · {duration} · "
            f"{ch.peakListenerCount} tepe izleyici · {ch.commentCount} sohbet mesajı"
        )
    now = datetime.utcnow()
    post = Post(
        authorId=ch.hostId,
        content=content,
        liveBroadcastId=ch.id,
        orbitId=ch.orbitId,
        createdAt=now,
        updatedAt=now,
    )
    await post.insert()
    await User.find_one(User.id == ch.hostId).update({"$inc": {"stats.postsCount": 1}})
    return post


@action("live.end")
async def end_live(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    if not channel_id:
        raise AppError("channelId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch:
        raise AppError("Channel not found", 404)
    if not _is_host(ch, user_id):
        raise AppError("Forbidden", 403)

    host = await User.get(ch.hostId)
    if ch.status == "ended":
        stats = await _stats_out(ch, host)
        return {"success": True, "stats": stats, "recapPostId": stats.get("replayPostId")}

    ch.status = "ended"
    ch.endedAt = datetime.utcnow()
    _bump_peak(ch, ch.listenerCount)
    ch.commentCount = await LiveComment.find(
        LiveComment.channelId == PydanticObjectId(channel_id),
    ).count()

    if ch.egressId and ch.recordingStatus == "recording":
        await stop_room_recording(ch.egressId)
        ch.recordingStatus = "processing"

    if not ch.replayPostId:
        recap = await _create_recap_post(ch, host)
        ch.replayPostId = recap.id

    await ch.save()
    ch = await try_finalize_egress(ch)

    stats = await _stats_out(ch, host)
    out = await _channel_out(ch, host)
    await _broadcast_channel("channel:ended", channel_id, out)
    await sio.emit("live:ended", {"channelId": channel_id, "stats": stats})
    return {
        "success": True,
        "stats": stats,
        "recapPostId": str(ch.replayPostId) if ch.replayPostId else None,
    }


def _livekit_connect(ch: LiveChannel, user: User | None, user_id: str) -> dict[str, Any]:
    can_pub = _can_publish(ch, user_id)
    token = create_room_token(
        room_name=ch.livekitRoom,
        identity=str(user_id),
        name=user.displayName if user else "User",
        can_publish=can_pub,
        can_publish_sources=_publish_sources(ch, user_id),
    )
    return {
        "url": settings_livekit_url(),
        "token": token,
        "roomName": ch.livekitRoom,
        "role": _role(ch, user_id),
    }


@action("live.token")
async def live_token(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    if not livekit_configured():
        raise AppError("Canlı yayın şu an kullanılamıyor", 422)

    channel_id = data.get("channelId") or data.get("id")
    if not channel_id:
        raise AppError("channelId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Canlı oda bulunamadı", 404)

    user = await User.get(user_id)

    if await _register_listener_presence(ch, user_id):
        ch.listenerCount += 1
        _bump_peak(ch, ch.listenerCount)
        await ch.save()
        out = await _channel_out(ch, user, viewer_id=user_id)
        await _broadcast_channel("channel:update", channel_id, out)

    return {
        "channel": await _channel_out(ch, user, viewer_id=user_id),
        "livekit": _livekit_connect(ch, user, user_id),
    }


@action("live.leave")
async def leave_live(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    if not channel_id:
        raise AppError("channelId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        return {"success": True}
    if _is_host(ch, user_id):
        return {"success": True}

    uid = _oid(user_id)
    changed = False
    if uid in ch.speakerIds:
        ch.speakerIds = [x for x in ch.speakerIds if x != uid]
        changed = True
    if uid in (ch.moderatorIds or []):
        ch.moderatorIds = [x for x in ch.moderatorIds if x != uid]
        changed = True
    if uid in ch.speakerRequestIds:
        ch.speakerRequestIds = [x for x in ch.speakerRequestIds if x != uid]
        changed = True
    if await _clear_listener_presence(ch, user_id) and ch.listenerCount > 0:
        ch.listenerCount -= 1
        changed = True

    if changed:
        await ch.save()
        await _emit_speakers_update(ch, channel_id)

    return {"success": True}


@action("live.space.request")
async def space_request_speak(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    if not channel_id:
        raise AppError("channelId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Oda bulunamadı", 404)
    _ensure_space(ch)
    if _is_host(ch, user_id) or _is_speaker(ch, user_id):
        raise AppError("Zaten konuşmacısın", 400)
    uid = _oid(user_id)
    if uid in ch.speakerRequestIds:
        return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}
    if _speaker_slots_left(ch) <= 0:
        raise AppError("Konuşmacı kotası dolu", 409)
    ch.speakerRequestIds.append(uid)
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


@action("live.space.cancel-request")
async def space_cancel_request(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    if not channel_id:
        raise AppError("channelId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch:
        raise AppError("Oda bulunamadı", 404)
    uid = _oid(user_id)
    ch.speakerRequestIds = [x for x in ch.speakerRequestIds if x != uid]
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


@action("live.space.approve")
async def space_approve_speaker(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    target_id = data.get("userId") or data.get("targetUserId")
    if not channel_id or not target_id:
        raise AppError("channelId and userId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Oda bulunamadı", 404)
    _ensure_space(ch)
    _ensure_room_manager(ch, user_id)
    tid = PydanticObjectId(target_id)
    if tid not in ch.speakerRequestIds:
        raise AppError("Konuşma isteği bulunamadı", 404)
    await _add_speaker(ch, tid)
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    await _broadcast_channel(
        "live:speaker:granted",
        channel_id,
        {"channelId": channel_id, "userId": str(tid)},
    )
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


@action("live.space.invite")
async def space_invite_speaker(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    target_id = data.get("userId") or data.get("targetUserId")
    if not channel_id or not target_id:
        raise AppError("channelId and userId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Oda bulunamadı", 404)
    _ensure_space(ch)
    _ensure_room_manager(ch, user_id)
    tid = PydanticObjectId(target_id)
    target = await User.get(tid)
    if not target:
        raise AppError("Kullanıcı bulunamadı", 404)
    await _add_speaker(ch, tid)
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    await _broadcast_channel(
        "live:speaker:granted",
        channel_id,
        {"channelId": channel_id, "userId": str(tid)},
    )
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


@action("live.space.revoke")
async def space_revoke_speaker(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    target_id = data.get("userId") or data.get("targetUserId")
    if not channel_id or not target_id:
        raise AppError("channelId and userId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Oda bulunamadı", 404)
    _ensure_space(ch)
    _ensure_room_manager(ch, user_id)
    tid = PydanticObjectId(target_id)
    if tid == ch.hostId:
        raise AppError("Oda sahibinin mikrofonu kapatılamaz", 400)
    if _is_moderator(ch, str(tid)) and not _is_host(ch, user_id):
        raise AppError("Yalnızca oda sahibi yöneticileri kaldırabilir", 403)
    ch.speakerIds = [x for x in ch.speakerIds if x != tid]
    ch.moderatorIds = [x for x in (ch.moderatorIds or []) if x != tid]
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    await _broadcast_channel(
        "live:speaker:revoked",
        channel_id,
        {"channelId": channel_id, "userId": str(tid)},
    )
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


@action("live.space.deny")
async def space_deny_request(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    target_id = data.get("userId") or data.get("targetUserId")
    if not channel_id or not target_id:
        raise AppError("channelId and userId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch:
        raise AppError("Oda bulunamadı", 404)
    _ensure_space(ch)
    _ensure_room_manager(ch, user_id)
    tid = PydanticObjectId(target_id)
    ch.speakerRequestIds = [x for x in ch.speakerRequestIds if x != tid]
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


@action("live.space.moderator.grant")
async def space_grant_moderator(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    target_id = data.get("userId") or data.get("targetUserId")
    if not channel_id or not target_id:
        raise AppError("channelId and userId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Oda bulunamadı", 404)
    _ensure_space(ch)
    _ensure_host(ch, user_id)
    tid = _oid(target_id)
    if tid == ch.hostId:
        raise AppError("Oda sahibi zaten tam yetkili", 400)
    if tid not in ch.speakerIds:
        raise AppError("Önce konuşmacı olmalı", 400)
    if tid in (ch.moderatorIds or []):
        return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}
    if len(ch.moderatorIds or []) >= MAX_MODERATORS:
        raise AppError(f"En fazla {MAX_MODERATORS} oda yöneticisi olabilir", 409)
    ch.moderatorIds = list(ch.moderatorIds or []) + [tid]
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


@action("live.space.moderator.revoke")
async def space_revoke_moderator(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    target_id = data.get("userId") or data.get("targetUserId")
    if not channel_id or not target_id:
        raise AppError("channelId and userId required", 400)
    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Oda bulunamadı", 404)
    _ensure_space(ch)
    _ensure_host(ch, user_id)
    tid = _oid(target_id)
    ch.moderatorIds = [x for x in (ch.moderatorIds or []) if x != tid]
    await ch.save()
    await _emit_speakers_update(ch, channel_id)
    return {"success": True, "channel": await _channel_out(ch, viewer_id=user_id)}


async def _comment_out(comment: LiveComment, user: User | None = None) -> dict[str, Any]:
    if user is None:
        user = await User.get(comment.userId)
    return {
        "id": str(comment.id),
        "channelId": str(comment.channelId),
        "content": comment.content,
        "createdAt": comment.createdAt.isoformat() + "Z",
        "author": user_out(user).model_dump(mode="json") if user else None,
    }


@action("live.chat.send")
async def live_chat_send(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    channel_id = data.get("channelId") or data.get("id")
    content = (data.get("content") or "").strip()
    if not channel_id:
        raise AppError("channelId required", 400)
    if not content:
        raise AppError("Mesaj boş olamaz", 400)
    if len(content) > 280:
        raise AppError("Mesaj çok uzun", 400)

    ch = await LiveChannel.get(channel_id)
    if not ch or ch.status != "live":
        raise AppError("Canlı oda bulunamadı", 404)

    user = await User.get(user_id)
    comment = LiveComment(
        channelId=PydanticObjectId(channel_id),
        userId=PydanticObjectId(user_id),
        content=content,
    )
    await comment.insert()
    ch.commentCount += 1
    await ch.save()
    out = await _comment_out(comment, user)
    await _broadcast_channel("channel:chat", channel_id, out)
    return out
