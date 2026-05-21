from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/")
async def app_meta():
    """İstemciler için genel uygulama bilgisi (auth gerekmez)."""
    return {
        "supportEmail": settings.support_email,
        "mailFromEmail": settings.mail_from_email,
    }
