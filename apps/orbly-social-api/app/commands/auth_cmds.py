from __future__ import annotations

import re
import secrets
from typing import Any

from beanie import PydanticObjectId
from passlib.context import CryptContext

from app.commands.json_util import to_jsonable
from app.commands.registry import action
from app.config import settings
from app.errors import AppError
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordIn,
    LoginIn,
    OAuthIn,
    OnboardingIn,
    RefreshIn,
    RegisterIn,
    ResetPasswordIn,
)
from app.schemas.common import AuthResponse
from app.services.auth_tokens import create_tokens, decode_token
from app.services.email import send_password_reset_email
from app.services.password_reset import (
    hash_reset_token,
    is_reset_expired,
    new_reset_token,
    reset_expires_at,
)
from app.services.serializers import user_out

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def _unique_username(base: str) -> str:
    base = re.sub(r"[^a-z0-9_]", "", base.lower())[:40] or "user"
    candidate = base
    n = 0
    while await User.find_one(User.username == candidate):
        n += 1
        candidate = f"{base}{n}"
    return candidate


@action("auth.register", public=True)
async def register(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = RegisterIn.model_validate(data)
    existing = await User.find_one(
        {"$or": [{"email": body.email.lower()}, {"username": body.username}]}
    )
    if existing:
        raise AppError("Email or username already taken", 409)
    user = User(
        username=body.username,
        displayName=body.displayName,
        email=body.email.lower(),
        passwordHash=pwd.hash(body.password),
    )
    await user.insert()
    return to_jsonable(AuthResponse(user=user_out(user), tokens=create_tokens(str(user.id))))


@action("auth.login", public=True)
async def login(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = LoginIn.model_validate(data)
    if "@" in body.login:
        user = await User.find_one({"email": body.login})
    else:
        user = await User.find_one({"username": body.login})
    if not user or not user.passwordHash:
        raise AppError("Invalid credentials", 401)
    if user.isBanned:
        raise AppError("Account suspended", 401)
    if not pwd.verify(body.password, user.passwordHash):
        raise AppError("Invalid credentials", 401)
    return to_jsonable(AuthResponse(user=user_out(user), tokens=create_tokens(str(user.id))))


@action("auth.refresh", public=True)
async def refresh(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = RefreshIn.model_validate(data)
    try:
        uid = decode_token(body.refreshToken, "refresh")
    except ValueError:
        raise AppError("Invalid refresh token", 401) from None
    user = await User.get(uid)
    if not user or user.isBanned:
        raise AppError("Invalid refresh token", 401)
    return to_jsonable(AuthResponse(user=user_out(user), tokens=create_tokens(str(user.id))))


@action("auth.oauth", public=True)
async def oauth_login(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = OAuthIn.model_validate(data)
    email = (body.email or "").lower()
    oauth_id = body.oauthId
    display_name = body.displayName or "Orbly User"

    if body.provider == "google" and body.idToken and settings.google_client_id:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        try:
            info = id_token.verify_oauth2_token(
                body.idToken, google_requests.Request(), settings.google_client_id
            )
            email = info.get("email", email).lower()
            oauth_id = info.get("sub", oauth_id)
            display_name = info.get("name", display_name)
        except Exception as exc:
            raise AppError("Invalid Google token", 401) from exc

    if body.provider == "apple" and body.idToken:
        from app.services.apple_auth import verify_apple_id_token

        try:
            info = await verify_apple_id_token(body.idToken)
        except ValueError as exc:
            raise AppError(str(exc), 401) from exc
        email = (info.get("email") or email).lower()
        oauth_id = info.get("sub", oauth_id)
        if not email:
            raise AppError("Apple account email required on first sign-in", 400)

    if not email:
        raise AppError("Email required for OAuth", 400)
    if not oauth_id:
        oauth_id = secrets.token_hex(16)

    user = await User.find_one(
        {"$or": [{"oauthProvider": body.provider, "oauthId": oauth_id}, {"email": email}]}
    )
    if user and user.isBanned:
        raise AppError("Account suspended", 401)

    if not user:
        username = await _unique_username(email.split("@")[0])
        user = User(
            username=username,
            displayName=display_name,
            email=email,
            avatarUrl=body.avatarUrl,
            oauthProvider=body.provider,
            oauthId=oauth_id,
            onboarded=False,
        )
        await user.insert()
    else:
        if not user.oauthProvider:
            user.oauthProvider = body.provider
            user.oauthId = oauth_id
        if body.avatarUrl and not user.avatarUrl:
            user.avatarUrl = body.avatarUrl
        await user.save()

    return to_jsonable(AuthResponse(user=user_out(user), tokens=create_tokens(str(user.id))))


FORGOT_PASSWORD_OK = {
    "ok": True,
    "message": "Eşleşen bir hesap varsa şifre sıfırlama bağlantısı e-posta adresine gönderildi.",
}


@action("auth.forgotPassword", public=True)
async def forgot_password(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = ForgotPasswordIn.model_validate(data)
    user = await User.find_one(
        {"email": body.email.lower(), "username": body.username},
    )
    if not user or not user.passwordHash or user.isBanned:
        return FORGOT_PASSWORD_OK

    token = new_reset_token()
    user.passwordResetTokenHash = hash_reset_token(token)
    user.passwordResetExpiresAt = reset_expires_at()
    await user.save()

    web_reset_url = f"{settings.web_app_url.rstrip('/')}/login?resetToken={token}"
    mobile_reset_url = f"{settings.mobile_app_scheme}://login?resetToken={token}"
    try:
        await send_password_reset_email(
            to=user.email,
            reset_url=web_reset_url,
            mobile_reset_url=mobile_reset_url,
        )
    except Exception as exc:
        user.passwordResetTokenHash = None
        user.passwordResetExpiresAt = None
        await user.save()
        raise AppError("E-posta gönderilemedi. Lütfen daha sonra tekrar dene.", 503) from exc

    return FORGOT_PASSWORD_OK


@action("auth.resetPassword", public=True)
async def reset_password(_user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = ResetPasswordIn.model_validate(data)
    token_hash = hash_reset_token(body.token)
    user = await User.find_one({"passwordResetTokenHash": token_hash})
    if not user or is_reset_expired(user.passwordResetExpiresAt):
        raise AppError("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş", 400)
    if not user.passwordHash:
        raise AppError("Bu hesap için şifre sıfırlama kullanılamaz", 400)

    user.passwordHash = pwd.hash(body.password)
    user.passwordResetTokenHash = None
    user.passwordResetExpiresAt = None
    await user.save()
    return {"ok": True, "message": "Şifren güncellendi. Giriş yapabilirsin."}


@action("auth.onboarding")
async def onboarding(user_id: str | None, data: dict[str, Any]) -> dict[str, Any]:
    body = OnboardingIn.model_validate(data)
    user = await User.get(user_id)
    if not user:
        raise AppError("User not found", 404)
    payload = body.model_dump(exclude_unset=True)
    if "orbitIds" in payload and payload["orbitIds"]:
        user.orbitIds = [PydanticObjectId(x) for x in payload.pop("orbitIds")]
    for k, v in payload.items():
        setattr(user, k, v)
    await user.save()
    return to_jsonable({"user": user_out(user)})
