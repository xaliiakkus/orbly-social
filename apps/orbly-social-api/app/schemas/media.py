from typing import Literal

from pydantic import BaseModel, Field

StoragePreference = Literal["auto", "cloudinary", "idrive"]


class PresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    contentType: str = Field(min_length=3, max_length=100)
    folder: str = Field(default="media", max_length=50)
    storage: StoragePreference = "auto"
