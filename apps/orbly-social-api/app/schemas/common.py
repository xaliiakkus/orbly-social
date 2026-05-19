from pydantic import BaseModel, Field


class UserStatsOut(BaseModel):
    followersCount: int = 0
    followingCount: int = 0
    postsCount: int = 0


class UserOut(BaseModel):
    id: str
    username: str
    displayName: str
    bio: str | None = None
    avatarUrl: str | None = None
    bannerUrl: str | None = None
    location: str | None = None
    website: str | None = None
    verified: bool = False
    isPrivate: bool = False
    onboarded: bool = False
    orbitIds: list[str] = []
    stats: UserStatsOut
    createdAt: str


class TokensOut(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int = 900


class AuthResponse(BaseModel):
    user: UserOut
    tokens: TokensOut


class PaginatedPosts(BaseModel):
    data: list["PostOut"]
    nextCursor: str | None = None
    hasMore: bool = False


class PaginatedUsers(BaseModel):
    data: list[UserOut]
    nextCursor: str | None = None
    hasMore: bool = False


class PostStatsOut(BaseModel):
    likeCount: int = 0
    replyCount: int = 0
    repostCount: int = 0
    bookmarkCount: int = 0
    viewCount: int = 0


class OrbitOut(BaseModel):
    id: str
    slug: str
    name: str
    description: str | None = None
    iconUrl: str | None = None
    bannerUrl: str | None = None
    stats: dict = Field(default_factory=dict)


class PollOptionOut(BaseModel):
    id: str
    text: str
    voteCount: int
    percent: float = 0


class PollOut(BaseModel):
    options: list[PollOptionOut]
    endsAt: str
    totalVotes: int
    votedOptionId: str | None = None
    ended: bool = False


class PostOut(BaseModel):
    id: str
    content: str
    mediaUrls: list[str] = []
    author: UserOut
    orbit: OrbitOut | None = None
    liveBroadcastId: str | None = None
    replyToId: str | None = None
    repostOfId: str | None = None
    hashtags: list[str] = []
    poll: PollOut | None = None
    stats: PostStatsOut
    likedByMe: bool | None = None
    bookmarkedByMe: bool | None = None
    createdAt: str
    updatedAt: str


PaginatedPosts.model_rebuild()
