from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.services.auth_tokens import decode_token


async def get_current_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization[7:]
    try:
        return decode_token(token, "access")
    except ValueError:
        raise HTTPException(status_code=401, detail="Unauthorized") from None


async def get_optional_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return decode_token(authorization[7:], "access")
    except ValueError:
        return None


UserId = Annotated[str, Depends(get_current_user_id)]
OptionalUserId = Annotated[str | None, Depends(get_optional_user_id)]
