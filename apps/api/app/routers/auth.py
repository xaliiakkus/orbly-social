from fastapi import APIRouter, HTTPException, Query

from app.commands.registry import dispatch
from app.deps import UserId
from app.errors import AppError
from app.models.user import User
from app.schemas.auth import LoginIn, OAuthIn
from app.services.serializers import user_out

router = APIRouter()


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


@router.post("/login")
async def login(body: LoginIn):
    """Server-side bootstrap (NextAuth). Clients should use socket auth.login."""
    try:
        return await dispatch("auth.login", None, body.model_dump())
    except AppError as exc:
        raise HTTPException(exc.status, exc.message) from exc


@router.post("/oauth")
async def oauth_login(body: OAuthIn):
    """Server-side bootstrap (NextAuth). Clients should use socket auth.oauth."""
    try:
        return await dispatch("auth.oauth", None, body.model_dump())
    except AppError as exc:
        raise HTTPException(exc.status, exc.message) from exc
