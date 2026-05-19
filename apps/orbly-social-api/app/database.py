from beanie import init_beanie
from pymongo import AsyncMongoClient
from pymongo.errors import ConfigurationError

from app.config import settings
from app.models import ALL_DOCUMENTS

_client: AsyncMongoClient | None = None


async def connect_db() -> None:
    global _client
    _client = AsyncMongoClient(settings.mongodb_uri)
    try:
        db = _client.get_default_database()
    except ConfigurationError:
        db = _client[settings.mongo_db_name]
    await init_beanie(database=db, document_models=ALL_DOCUMENTS)


async def close_db() -> None:
    global _client
    if _client:
        await _client.close()
        _client = None
