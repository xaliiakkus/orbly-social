from beanie import Document, PydanticObjectId


class Bookmark(Document):
    userId: PydanticObjectId
    postId: PydanticObjectId

    class Settings:
        name = "bookmarks"
