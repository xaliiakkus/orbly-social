import re

from pydantic import BaseModel, Field

SLUG_RE = re.compile(r"^[a-z0-9-]+$")


class CreateOrbitIn(BaseModel):
    slug: str = Field(min_length=2, max_length=50)
    name: str = Field(max_length=100)
    description: str | None = Field(None, max_length=500)
    iconUrl: str | None = None
    bannerUrl: str | None = None


class UpdateOrbitIn(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    iconUrl: str | None = None
    bannerUrl: str | None = None
