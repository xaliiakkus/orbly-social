from pydantic import BaseModel, Field


class PollIn(BaseModel):
    options: list[str] = Field(min_length=2, max_length=4)
    durationHours: int = Field(default=24, ge=1, le=168)


class CreatePostIn(BaseModel):
    content: str = Field(min_length=1, max_length=280)
    mediaUrls: list[str] = Field(default_factory=list, max_length=4)
    replyToId: str | None = None
    repostOfId: str | None = None
    orbitId: str | None = None
    poll: PollIn | None = None


class UpdatePostIn(BaseModel):
    content: str = Field(min_length=1, max_length=280)
    mediaUrls: list[str] = Field(default_factory=list, max_length=4)


class RepostIn(BaseModel):
    content: str | None = Field(None, max_length=280)


class PollVoteIn(BaseModel):
    optionId: str
