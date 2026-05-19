from datetime import datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, EmailStr, Field


class UserStats(BaseModel):
    followersCount: int = 0
    followingCount: int = 0
    postsCount: int = 0


class User(Document):
    username: str
    displayName: str
    email: EmailStr
    passwordHash: str | None = None
    bio: str | None = None
    avatarUrl: str | None = None
    bannerUrl: str | None = None
    location: str | None = None
    website: str | None = None
    verified: bool = False
    role: Literal["user", "admin"] = "user"
    isPrivate: bool = False
    isBanned: bool = False
    onboarded: bool = False
    oauthProvider: str | None = None
    oauthId: str | None = None
    stats: UserStats = Field(default_factory=UserStats)
    orbitIds: list[PydanticObjectId] = Field(default_factory=list)

    class Settings:
        name = "users"
