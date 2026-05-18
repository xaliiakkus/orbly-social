from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import close_db, connect_db
from app.routers import (
    auth,
    bookmarks,
    conversations,
    feed,
    media,
    notifications,
    orbits,
    posts,
    search,
    users,
)
from app.services.r2 import UPLOAD_DIR
from app.services.realtime import mount_socketio
from app.services.redis_client import close_redis, connect_redis


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await connect_db()
    await connect_redis()
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

origins = [o.strip() for o in settings.cors_origin.split(",") if o.strip()]
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
app.include_router(media.router, prefix="/v1/media", tags=["Media"])

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "orbly-api", "redis": settings.redis_enabled}


@app.get("/", include_in_schema=False)
async def root():
    return {
        "docs": "/docs",
        "socket": settings.socket_path,
        "uploads": "/uploads",
    }


app = mount_socketio(app)
