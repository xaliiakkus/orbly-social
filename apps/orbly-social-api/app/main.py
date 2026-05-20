from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.errors import AppError
from app.middleware.request_metrics import RequestMetricsMiddleware, snapshot
from app.database import close_db, connect_db
from app.routers import (
    auth,
    bookmarks,
    conversations,
    feed,
    live,
    live_webhook,
    media,
    notifications,
    orbits,
    posts,
    search,
    users,
)
from app.services.default_orbits import ensure_default_orbits
from app.services.r2 import UPLOAD_DIR
from app.services.realtime import mount_socketio
from app.services.redis_client import close_redis, connect_redis


def _validate_mongo_uri(uri: str) -> None:
    if not uri.startswith(("mongodb://", "mongodb+srv://")):
        raise RuntimeError("MONGO_URI must start with mongodb:// or mongodb+srv://")
    if "@@" in uri:
        raise RuntimeError(
            "MONGO_URI contains @@ — password likely has raw @; URL-encode it as %40"
        )
    if uri.count("@") > 1:
        raise RuntimeError(
            "MONGO_URI has multiple @ — encode special chars in password (& → %26, @ → %40)"
        )
    host = uri.split("@")[-1].split("/")[0].split("?")[0]
    if not host or host.startswith(".") or ".." in host:
        raise RuntimeError(
            f"MONGO_URI host is invalid ({host!r}). "
            "On Windows use single quotes: fly secrets set MONGO_URI='mongodb+srv://...'"
        )


def _ensure_production_config() -> None:
    if settings.node_env != "production":
        return
    if "127.0.0.1" in settings.mongodb_uri or "localhost" in settings.mongodb_uri:
        raise RuntimeError(
            "Production requires MONGO_URI (Atlas). Run: fly secrets set MONGO_URI='mongodb+srv://...'"
        )
    _validate_mongo_uri(settings.mongodb_uri)
    if settings.jwt_secret.startswith("change-me"):
        raise RuntimeError(
            "Production requires JWT_SECRET. Run: fly secrets set JWT_SECRET='...'"
        )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _ensure_production_config()
    await connect_db()
    await connect_redis()
    await ensure_default_orbits()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield
    await close_redis()
    await close_db()


app = FastAPI(
    title="Orbly.social API",
    description="X.com benzeri sosyal ağ — JWT: `Authorization: Bearer <accessToken>`",
    version="1.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status, content={"detail": exc.message})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Geçersiz istek"})


@app.exception_handler(Exception)
async def unhandled_error_handler(_request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else "İstek başarısız"
        return JSONResponse(status_code=exc.status_code, content={"detail": detail})
    return JSONResponse(status_code=500, content={"detail": "Sunucuda bir sorun oluştu"})


origins = [o.strip() for o in settings.cors_origin.split(",") if o.strip()]
app.add_middleware(RequestMetricsMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/v1/users", tags=["Users"])
app.include_router(posts.router, prefix="/v1/posts", tags=["Posts"])
app.include_router(feed.router, prefix="/v1/feed", tags=["Feed"])
app.include_router(orbits.router, prefix="/v1/orbits", tags=["Orbits"])
app.include_router(notifications.router, prefix="/v1/notifications", tags=["Notifications"])
app.include_router(conversations.router, prefix="/v1/conversations", tags=["Conversations"])
app.include_router(bookmarks.router, prefix="/v1/bookmarks", tags=["Bookmarks"])
app.include_router(search.router, prefix="/v1/search", tags=["Search"])
app.include_router(live.router, prefix="/v1/live", tags=["Live"])
app.include_router(live_webhook.router, prefix="/v1/live", tags=["Live"])
app.include_router(media.router, prefix="/v1/media", tags=["Media"])

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health", tags=["System"])
async def health():
    from app.services.cloudinary_media import is_configured as cloudinary_configured
    from app.services.livekit_egress import egress_storage_configured
    from app.services.livekit_tokens import livekit_configured
    from app.services.redis_client import redis_ok

    return {
        "status": "ok",
        "service": "orbly-api",
        "redis": settings.redis_enabled and redis_ok(),
        "cloudinary": cloudinary_configured(),
        "live": livekit_configured(),
        "vod": egress_storage_configured(),
    }


@app.get("/health/metrics", tags=["System"])
async def health_metrics():
    return snapshot()


@app.get("/", include_in_schema=False)
async def root():
    return {
        "docs": "/docs",
        "socket": settings.socket_path,
        "uploads": "/uploads",
    }


app = mount_socketio(app)
