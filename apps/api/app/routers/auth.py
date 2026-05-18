import re
import secrets

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.deps import UserId
from app.models.user import User
from app.schemas.auth import LoginIn, OAuthIn, OnboardingIn, RefreshIn, RegisterIn
from app.schemas.common import AuthResponse
from app.services.auth_tokens import create_tokens, decode_token
from app.services.serializers import user_out
from passlib.context import CryptContext

router = APIRouter()
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterIn):
    existing = await User.find_one(
        {"$or": [{"email": body.email.lower()}, {"username": body.username}]}
    )
    if existing:
        raise HTTPException(409, "Email or username already taken")

    user = User(
        username=body.username,
        displayName=body.displayName,
        email=body.email.lower(),
        passwordHash=pwd.hash(body.password),
    )
    await user.insert()
    tokens = create_tokens(str(user.id))
    return AuthResponse(user=user_out(user), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginIn):
    user = await User.find_one({"email": body.email.lower()})
    if not user or not user.passwordHash:
        raise HTTPException(401, "Invalid credentials")
    if user.isBanned:
        raise HTTPException(401, "Account suspended")
    if not pwd.verify(body.password, user.passwordHash):
        raise HTTPException(401, "Invalid credentials")
    return AuthResponse(user=user_out(user), tokens=create_tokens(str(user.id)))


@router.post("/refresh", response_model=AuthResponse)
async def refresh(body: RefreshIn):
    try:
        user_id = decode_token(body.refreshToken, "refresh")
    except ValueError:
        raise HTTPException(401, "Invalid refresh token") from None
    user = await User.get(user_id)
    if not user or user.isBanned:
        raise HTTPException(401, "Invalid refresh token")
    return AuthResponse(user=user_out(user), tokens=create_tokens(str(user.id)))


@router.get("/me")
async def me(user_id: UserId):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return {"user": user_out(user)}


@router.get("/username-available")
async def username_available(username: str = Query(min_length=3, max_length=50)):
    taken = await User.find_one(User.username == username.lower())
    return {"available": taken is None}


async def _unique_username(base: str) -> str:
    base = re.sub(r"[^a-z0-9_]", "", base.lower())[:40] or "user"
    candidate = base
    n = 0
    while await User.find_one(User.username == candidate):
        n += 1
        candidate = f"{base}{n}"
    return candidate


@router.post("/oauth", response_model=AuthResponse)
async def oauth_login(body: OAuthIn):
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
            raise HTTPException(401, "Invalid Google token") from exc

    if body.provider == "apple" and body.idToken:
        from app.services.apple_auth import verify_apple_id_token

        try:
            info = await verify_apple_id_token(body.idToken)
        except ValueError as exc:
            raise HTTPException(401, str(exc)) from exc
        email = (info.get("email") or email).lower()
        oauth_id = info.get("sub", oauth_id)
        if not email:
            raise HTTPException(400, "Apple account email required on first sign-in")

    if not email:
        raise HTTPException(400, "Email required for OAuth")

    if not oauth_id:
        oauth_id = secrets.token_hex(16)

    user = await User.find_one(
        {
            "$or": [
                {"oauthProvider": body.provider, "oauthId": oauth_id},
                {"email": email},
            ]
        }
    )
    if user and user.isBanned:
        raise HTTPException(401, "Account suspended")

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

    return AuthResponse(user=user_out(user), tokens=create_tokens(str(user.id)))


@router.patch("/onboarding")
async def onboarding(body: OnboardingIn, user_id: UserId):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    data = body.model_dump(exclude_unset=True)
    if "orbitIds" in data and data["orbitIds"]:
        from beanie import PydanticObjectId

        user.orbitIds = [PydanticObjectId(x) for x in data.pop("orbitIds")]
    for k, v in data.items():
        setattr(user, k, v)
    await user.save()
    return {"user": user_out(user)}
