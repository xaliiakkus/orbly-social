from pydantic import BaseModel, Field


class UpdateProfileIn(BaseModel):
    displayName: str | None = Field(None, min_length=1, max_length=100)
    bio: str | None = Field(None, max_length=160)
    location: str | None = Field(None, max_length=100)
    website: str | None = Field(None, max_length=255)
    avatarUrl: str | None = None
    bannerUrl: str | None = None
    isPrivate: bool | None = None
