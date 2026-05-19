import re

from pydantic import BaseModel, EmailStr, Field, field_validator

_USERNAME_RE = re.compile(r"^[a-z0-9_]+$")


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=50, examples=["ahmet"])
    displayName: str = Field(min_length=1, max_length=100, examples=["Ahmet Yılmaz"])
    email: EmailStr = Field(examples=["ahmet@orbly.social"])
    password: str = Field(min_length=8, max_length=128, examples=["GuvenliSifre123"])

    @field_validator("username")
    @classmethod
    def username_format(cls, v: str) -> str:
        v = v.lower().strip()
        if not _USERNAME_RE.match(v):
            raise ValueError(
                "Kullanıcı adı yalnızca küçük harf, rakam ve alt çizgi içerebilir"
            )
        return v


class LoginIn(BaseModel):
    email: EmailStr = Field(examples=["demo@orbly.social"])
    password: str = Field(examples=["password123"])


class RefreshIn(BaseModel):
    refreshToken: str


class OAuthIn(BaseModel):
    provider: str = Field(pattern="^(google|apple)$")
    idToken: str | None = None
    accessToken: str | None = None
    email: EmailStr | None = None
    displayName: str | None = Field(None, min_length=1, max_length=100)
    avatarUrl: str | None = None
    oauthId: str | None = None


class OnboardingIn(BaseModel):
    displayName: str | None = Field(None, min_length=1, max_length=100)
    bio: str | None = Field(None, max_length=160)
    avatarUrl: str | None = None
    orbitIds: list[str] | None = None
    onboarded: bool | None = None
