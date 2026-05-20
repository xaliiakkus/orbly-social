from __future__ import annotations

from typing import Any

import httpx

from app.config import settings

GIPHY_BASE = "https://api.giphy.com/v1/gifs"


def _map_results(items: list[dict[str, Any]]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for item in items:
        images = item.get("images") or {}
        gif = images.get("downsized") or images.get("original") or images.get("fixed_width")
        preview = images.get("fixed_width_small") or images.get("preview_gif") or gif
        if not gif:
            continue
        gif_url = gif.get("url", "")
        if not gif_url:
            continue
        preview_url = (preview or {}).get("url", gif_url)
        out.append(
            {
                "id": f"giphy:{item.get('id', '')}",
                "url": gif_url,
                "previewUrl": preview_url,
                "width": str(gif.get("width", 0)),
                "height": str(gif.get("height", 0)),
                "source": "giphy",
            }
        )
    return out


async def search_gifs(query: str, *, limit: int = 20) -> list[dict[str, str]]:
    if not settings.giphy_api_key:
        return []

    params: dict[str, str | int] = {
        "api_key": settings.giphy_api_key,
        "limit": min(limit, 30),
        "rating": "g",
        "lang": "tr",
    }
    path = "trending" if not query.strip() else "search"
    if path == "search":
        params["q"] = query.strip()

    async with httpx.AsyncClient(timeout=12) as client:
        res = await client.get(f"{GIPHY_BASE}/{path}", params=params)
        res.raise_for_status()
        data = res.json()
    return _map_results(data.get("data", []))
