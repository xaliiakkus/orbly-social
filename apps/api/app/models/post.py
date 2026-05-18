from datetime import datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class PostStats(BaseModel):
    likeCount: int = 0
    replyCount: int = 0
    repostCount: int = 0
    bookmarkCount: int = 0
    viewCount: int = 0


class PollOption(BaseModel):
    id: str
    text: str
    voteCount: int = 0


class Poll(BaseModel):
    options: list[PollOption] = Field(min_length=2, max_length=4)
    endsAt: datetime
    totalVotes: int = 0


class Post(Document):
    authorId: PydanticObjectId
    content: str
    mediaUrls: list[str] = Field(default_factory=list)
    replyToId: PydanticObjectId | None = None
    repostOfId: PydanticObjectId | None = None
    orbitId: PydanticObjectId | None = None
    hashtags: list[str] = Field(default_factory=list)
    mentions: list[PydanticObjectId] = Field(default_factory=list)
    poll: Poll | None = None
    pollVotes: dict[str, str] = Field(default_factory=dict)
    stats: PostStats = Field(default_factory=PostStats)
    isDeleted: bool = False
    createdAt: datetime | None = None
    updatedAt: datetime | None = None

    class Settings:
        name = "posts"
