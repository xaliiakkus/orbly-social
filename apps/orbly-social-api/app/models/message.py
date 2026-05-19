from beanie import Document, PydanticObjectId
from pydantic import Field


class Message(Document):
    conversationId: PydanticObjectId
    senderId: PydanticObjectId
    content: str
    mediaUrls: list[str] = Field(default_factory=list)
    isRead: bool = False

    class Settings:
        name = "messages"
