from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class OrbitStats(BaseModel):
    memberCount: int = 0
    postCount: int = 0


class Orbit(Document):
    slug: str
    name: str
    description: str | None = None
    iconUrl: str | None = None
    bannerUrl: str | None = None
    createdBy: PydanticObjectId | None = None
    stats: OrbitStats = Field(default_factory=OrbitStats)

    class Settings:
        name = "orbits"
