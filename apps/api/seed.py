"""Seed orbits + demo user. Run: python seed.py"""
import asyncio

from beanie import init_beanie
from pymongo import AsyncMongoClient
from passlib.context import CryptContext

from app.config import settings
from app.models import ALL_DOCUMENTS
from app.models.orbit import Orbit, OrbitStats
from app.models.user import User, UserStats

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

ORBITS = [
    {"slug": "tech", "name": "Tech", "description": "Yazılım, donanım ve startup"},
    {"slug": "design", "name": "Design", "description": "UI/UX ve ürün tasarımı"},
    {"slug": "gaming", "name": "Gaming", "description": "Oyun ve e-spor"},
    {"slug": "music", "name": "Music", "description": "Müzik ve prodüksiyon"},
    {"slug": "fitness", "name": "Fitness", "description": "Spor ve wellness"},
    {"slug": "crypto", "name": "Crypto", "description": "Blockchain ve Web3"},
]


async def main() -> None:
    client = AsyncMongoClient(settings.mongodb_uri)
    db = client.get_default_database()
    if db is None:
        db = client["orbly"]
    await init_beanie(database=db, document_models=ALL_DOCUMENTS)

    for o in ORBITS:
        existing = await Orbit.find_one(Orbit.slug == o["slug"])
        if not existing:
            await Orbit(slug=o["slug"], name=o["name"], description=o["description"], stats=OrbitStats()).insert()

    demo = await User.find_one(User.email == "demo@orbly.social")
    if not demo:
        await User(
            username="demo",
            displayName="Demo User",
            email="demo@orbly.social",
            passwordHash=pwd.hash("password123"),
            onboarded=True,
            bio="Orbly demo hesabı",
            stats=UserStats(),
        ).insert()

    print("Seed OK:", len(ORBITS), "orbits, demo@orbly.social / password123")
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
