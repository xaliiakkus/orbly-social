from typing import Any

from beanie import Document


async def aggregate_to_list(
    model: type[Document],
    pipeline: list[dict[str, Any]],
    *,
    length: int | None = None,
) -> list[dict[str, Any]]:
    collection = model.get_pymongo_collection()
    cursor = await collection.aggregate(pipeline)
    if length is not None:
        return await cursor.to_list(length=length)
    return await cursor.to_list()
