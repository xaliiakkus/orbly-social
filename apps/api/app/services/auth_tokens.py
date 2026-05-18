from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import settings
from app.schemas.common import TokensOut

ALGORITHM = "HS256"


def create_tokens(user_id: str) -> TokensOut:
    now = datetime.now(timezone.utc)
    access = jwt.encode(
        {"sub": user_id, "type": "access", "exp": now + timedelta(minutes=settings.jwt_access_expires_min)},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )
    refresh = jwt.encode(
        {
            "sub": user_id,
            "type": "refresh",
            "exp": now + timedelta(days=settings.jwt_refresh_expires_days),
        },
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )
    return TokensOut(accessToken=access, refreshToken=refresh, expiresIn=settings.jwt_access_expires_min * 60)


def decode_token(token: str, expected_type: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        if payload.get("type") != expected_type:
            raise JWTError("wrong type")
        sub = payload.get("sub")
        if not sub:
            raise JWTError("no sub")
        return str(sub)
    except JWTError as e:
        raise ValueError("Invalid token") from e
