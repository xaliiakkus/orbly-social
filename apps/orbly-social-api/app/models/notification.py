from typing import Literal

from beanie import Document, PydanticObjectId


class Notification(Document):
    userId: PydanticObjectId
    actorId: PydanticObjectId | None = None
    type: Literal["like", "reply", "repost", "follow", "mention", "orbit_invite"]
    postId: PydanticObjectId | None = None
    isRead: bool = False

    class Settings:
        name = "notifications"
