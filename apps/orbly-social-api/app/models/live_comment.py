from datetime import datetime

from beanie import Document, PydanticObjectId
from pydantic import Field


class LiveComment(Document):
    channelId: PydanticObjectId
    userId: PydanticObjectId
    content: str = Field(max_length=280)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "live_comments"
