from __future__ import annotations

from beanie import PydanticObjectId
from beanie.operators import In

from app.models.post import Post


async def get_thread_root_id(post_id: str | PydanticObjectId) -> PydanticObjectId:
    oid = PydanticObjectId(post_id) if isinstance(post_id, str) else post_id
    current = await Post.get(oid)
    if not current:
        return oid
    while current.replyToId:
        parent = await Post.get(current.replyToId)
        if not parent:
            break
        current = parent
    return current.id  # type: ignore[return-value]


async def list_thread_replies(root_post_id: str, *, limit: int = 200) -> list[Post]:
    """Kök gönderiye bağlı tüm iç içe yanıtlar (kronolojik)."""
    root_oid = PydanticObjectId(root_post_id)
    collected: list[Post] = []
    frontier: list[PydanticObjectId] = [root_oid]
    seen: set[PydanticObjectId] = {root_oid}

    while frontier and len(collected) < limit:
        children = (
            await Post.find(
                In(Post.replyToId, frontier),
                Post.isDeleted == False,
            )
            .sort(+Post.createdAt)
            .to_list()
        )
        next_frontier: list[PydanticObjectId] = []
        for child in children:
            if child.id in seen:
                continue
            seen.add(child.id)
            collected.append(child)
            next_frontier.append(child.id)
        frontier = next_frontier

    return collected
