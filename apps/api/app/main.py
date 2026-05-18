from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_db, connect_db
from app.routers import auth, bookmarks, conversations, feed, notifications, orbits, posts, users


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Orbly.social API",
    description="X.com benzeri sosyal ağ — JWT: `Authorization: Bearer <accessToken>`",
    version="1.0.0",
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


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "orbly-api"}


@app.get("/", include_in_schema=False)
async def root():
    return {"docs": "/docs", "redoc": "/redoc", "openapi": "/openapi.json"}
