from pydantic import BaseModel, Field


class CreateConversationIn(BaseModel):
    participantId: str


class SendMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    mediaUrls: list[str] = Field(default_factory=list, max_length=4)
