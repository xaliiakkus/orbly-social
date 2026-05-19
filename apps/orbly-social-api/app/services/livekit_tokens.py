from __future__ import annotations

from app.config import settings


def livekit_configured() -> bool:
    return bool(settings.livekit_api_key and settings.livekit_api_secret and settings.livekit_url)


def create_room_token(
    *,
    room_name: str,
    identity: str,
    name: str,
    can_publish: bool,
    can_publish_sources: list[str] | None = None,
) -> str:
    if not livekit_configured():
        raise RuntimeError("LiveKit is not configured")

    try:
        from livekit.api import AccessToken, VideoGrants
    except ImportError as exc:
        raise RuntimeError(
            "livekit-api paketi yüklü değil (pip install livekit-api)"
        ) from exc

    grants = VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=can_publish,
        can_subscribe=True,
    )
    if can_publish and can_publish_sources:
        grants.can_publish_sources = can_publish_sources  # type: ignore[attr-defined]

    return (
        AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(identity)
        .with_name(name)
        .with_grants(grants)
        .to_jwt()
    )
