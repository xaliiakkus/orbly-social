from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, IndexModel


class Like(Document):
    userId: PydanticObjectId
    postId: PydanticObjectId

    class Settings:
        name = "likes"
        indexes = [
            IndexModel(
                [("userId", ASCENDING), ("postId", ASCENDING)],
                unique=True,
                name="userId_postId_unique",
            ),
        ]
