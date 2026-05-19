from typing import Any

import httpx

from app.config import settings

TENOR_BASE = "https://tenor.googleapis.com/v2"


def _map_results(items: list[dict[str, Any]]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for item in items:
        media = item.get("media_formats") or {}
        gif = media.get("gif") or media.get("mediumgif") or media.get("tinygif")
        preview = media.get("tinygif") or media.get("nanogif") or gif
        if not gif:
            continue
        out.append(
            {
                "id": str(item.get("id", "")),
                "url": gif.get("url", ""),
                "previewUrl": preview.get("url", gif.get("url", "")),
                "width": str(gif.get("dims", [0, 0])[0]),
                "height": str(gif.get("dims", [0, 0])[1]),
            }
        )
    return out


async def search_gifs(query: str, *, limit: int = 20) -> list[dict[str, str]]:
    if not settings.tenor_api_key:
        return []

    params: dict[str, str | int] = {
        "key": settings.tenor_api_key,
        "client_key": "orbly",
        "limit": min(limit, 30),
    }
    path = "featured" if not query.strip() else "search"
    if path == "search":
        params["q"] = query.strip()

    async with httpx.AsyncClient(timeout=12) as client:
        res = await client.get(f"{TENOR_BASE}/{path}", params=params)
        res.raise_for_status()
        data = res.json()
    return _map_results(data.get("results", []))
