from fastapi import APIRouter, HTTPException, Query

from app.deps import UserId
from app.models.user import User
from app.schemas.auth import LoginIn, OnboardingIn, RefreshIn, RegisterIn
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
