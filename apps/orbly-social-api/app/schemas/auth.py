from __future__ import annotations

import re

from pydantic import AliasChoices, BaseModel, EmailStr, Field, field_validator, model_validator

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
    """E-posta veya kullanıcı adı (`login`; eski istemciler `email` anahtarını da gönderebilir)."""

    login: str = Field(
        min_length=3,
        max_length=255,
        validation_alias=AliasChoices("login", "email"),
        examples=["info@orbly.social", "demo"],
    )
    password: str = Field(examples=["your-password"])

    @field_validator("login")
    @classmethod
    def normalize_login(cls, v: str) -> str:
        v = v.strip()
        if "@" in v:
            return v.lower()
        v = v.lower()
        if not _USERNAME_RE.match(v):
            raise ValueError(
                "Kullanıcı adı yalnızca küçük harf, rakam ve alt çizgi içerebilir"
            )
        return v


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


class ForgotPasswordIn(BaseModel):
    email: EmailStr = Field(examples=["info@orbly.social"])
    username: str = Field(min_length=3, max_length=50, examples=["demo"])

    @field_validator("username")
    @classmethod
    def username_format(cls, v: str) -> str:
        v = v.lower().strip()
        if not _USERNAME_RE.match(v):
            raise ValueError(
                "Kullanıcı adı yalnızca küçük harf, rakam ve alt çizgi içerebilir"
            )
        return v


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=16, max_length=256)
    password: str = Field(min_length=8, max_length=128)
    confirmPassword: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def passwords_match(self) -> ResetPasswordIn:
        if self.password != self.confirmPassword:
            raise ValueError("Şifreler eşleşmiyor")
        return self
