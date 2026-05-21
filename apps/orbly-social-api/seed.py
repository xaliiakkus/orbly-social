"""Seed default orbits. Run: python seed.py"""
import asyncio

from beanie import init_beanie
from pymongo import AsyncMongoClient
from pymongo.errors import ConfigurationError

from app.config import settings
from app.models import ALL_DOCUMENTS
from app.models.orbit import Orbit, OrbitStats

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
    try:
        db = client.get_default_database()
    except ConfigurationError:
        db = client[settings.mongo_db_name]
    await init_beanie(database=db, document_models=ALL_DOCUMENTS)

    for o in ORBITS:
        existing = await Orbit.find_one(Orbit.slug == o["slug"])
        if not existing:
            await Orbit(slug=o["slug"], name=o["name"], description=o["description"], stats=OrbitStats()).insert()

    print("Seed OK:", len(ORBITS), "orbits")


if __name__ == "__main__":
    asyncio.run(main())
