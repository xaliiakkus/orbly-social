from __future__ import annotations

import asyncio
import logging

from beanie import PydanticObjectId

from app.models.follow import Follow
from app.models.post import Post
from app.services.realtime import emit_feed_update
from app.services.redis_client import feed_push

logger = logging.getLogger(__name__)


async def fanout_post(post: Post) -> None:
    author_id = str(post.authorId)
    followers = await Follow.find(Follow.followingId == post.authorId).to_list()
    follower_ids = [str(f.followerId) for f in followers]
    follower_ids.append(author_id)
    post_id = str(post.id)

    async def _push(uid: str) -> None:
        await feed_push(uid, post_id)
        await emit_feed_update(uid, {"postId": post_id, "authorId": author_id})

    await asyncio.gather(*[_push(uid) for uid in follower_ids], return_exceptions=True)
    logger.debug("Fanout post %s to %d feeds", post_id, len(follower_ids))
