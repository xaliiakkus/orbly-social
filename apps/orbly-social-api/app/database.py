from beanie import init_beanie
from pymongo import AsyncMongoClient

from app.config import settings
from app.models import ALL_DOCUMENTS

_client: AsyncMongoClient | None = None


async def connect_db() -> None:
    global _client
    _client = AsyncMongoClient(settings.mongodb_uri)
    db = _client.get_default_database()
    if db is None:
        db = _client["orbly"]
    await init_beanie(database=db, document_models=ALL_DOCUMENTS)


async def close_db() -> None:
    global _client
    if _client:
        await _client.close()
        _client = None
