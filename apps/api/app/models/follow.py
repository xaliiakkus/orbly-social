from beanie import Document, PydanticObjectId


class Follow(Document):
    followerId: PydanticObjectId
    followingId: PydanticObjectId

    class Settings:
        name = "follows"
