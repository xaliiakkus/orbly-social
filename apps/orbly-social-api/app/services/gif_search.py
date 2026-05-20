from __future__ import annotations

import asyncio
import logging

from app.config import settings
from app.services import giphy, tenor

logger = logging.getLogger(__name__)


def _interleave(
    *lists: list[dict[str, str]],
    limit: int,
) -> list[dict[str, str]]:
    """Tenor ve Giphy sonuçlarını sırayla birleştir, aynı URL'yi atla."""
    merged: list[dict[str, str]] = []
    seen: set[str] = set()
    indices = [0] * len(lists)
    while len(merged) < limit:
        added = False
        for i, batch in enumerate(lists):
            while indices[i] < len(batch):
                item = batch[indices[i]]
                indices[i] += 1
                url = item.get("url", "")
                if url and url not in seen:
                    seen.add(url)
                    merged.append(item)
                    added = True
                    break
            if len(merged) >= limit:
                break
        if not added:
            break
    return merged


async def search_gifs(query: str, *, limit: int = 20) -> list[dict[str, str]]:
    has_tenor = bool(settings.tenor_api_key)
    has_giphy = bool(settings.giphy_api_key)
    if not has_tenor and not has_giphy:
        return []

    per_provider = max(limit // 2, 10) if has_tenor and has_giphy else limit
    tasks: list[asyncio.Task[list[dict[str, str]]]] = []

    if has_tenor:
        tasks.append(asyncio.create_task(tenor.search_gifs(query, limit=per_provider)))
    if has_giphy:
        tasks.append(asyncio.create_task(giphy.search_gifs(query, limit=per_provider)))

    batches: list[list[dict[str, str]]] = []
    for task in tasks:
        try:
            batches.append(await task)
        except Exception as exc:
            logger.warning("GIF provider failed: %s", exc)
            batches.append([])

    if len(batches) == 1:
        return batches[0][:limit]
    return _interleave(*batches, limit=limit)
