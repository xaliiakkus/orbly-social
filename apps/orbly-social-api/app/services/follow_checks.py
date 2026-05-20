from beanie import PydanticObjectId

from app.models.follow import Follow


async def viewer_follows(viewer_id: str, target_id: str) -> bool:
    return (
        await Follow.find_one(
            Follow.followerId == PydanticObjectId(viewer_id),
            Follow.followingId == PydanticObjectId(target_id),
        )
        is not None
    )


async def is_mutual_follow(user_a: str, user_b: str) -> bool:
    if user_a == user_b:
        return False
    a_follows_b = await viewer_follows(user_a, user_b)
    b_follows_a = await viewer_follows(user_b, user_a)
    return a_follows_b and b_follows_a


async def require_mutual_follow_for_dm(user_id: str, other_id: str) -> None:
    from app.errors import AppError

    if not await is_mutual_follow(user_id, other_id):
        raise AppError("Mutual follow required for direct messages", 403)
