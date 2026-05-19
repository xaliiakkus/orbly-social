from datetime import datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class LastMessage(BaseModel):
    content: str | None = None
    senderId: PydanticObjectId | None = None
    createdAt: datetime | None = None


class Conversation(Document):
    participantIds: list[PydanticObjectId] = Field(default_factory=list)
    lastMessage: LastMessage | None = None
    unreadCounts: dict[str, int] = Field(default_factory=dict)

    class Settings:
        name = "conversations"
