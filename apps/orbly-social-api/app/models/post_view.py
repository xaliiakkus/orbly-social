from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, IndexModel


class PostView(Document):
    userId: PydanticObjectId
    postId: PydanticObjectId

    class Settings:
        name = "post_views"
        indexes = [
            IndexModel(
                [("userId", ASCENDING), ("postId", ASCENDING)],
                unique=True,
                name="userId_postId_unique",
            ),
        ]
