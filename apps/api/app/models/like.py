from beanie import Document, PydanticObjectId


class Like(Document):
    userId: PydanticObjectId
    postId: PydanticObjectId

    class Settings:
        name = "likes"
