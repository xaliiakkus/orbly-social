from datetime import datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field

LiveMode = Literal["audio", "video"]
LiveKind = Literal["broadcast", "space"]
LiveStatus = Literal["live", "ended"]
RecordingStatus = Literal["none", "recording", "processing", "ready", "failed"]

MAX_SPACE_SPEAKERS = 10
MAX_MODERATORS = 2


class LiveChannel(Document):
    hostId: PydanticObjectId
    title: str = Field(max_length=120)
    orbitId: PydanticObjectId | None = None
    kind: LiveKind = "broadcast"
    mode: LiveMode = "video"
    status: LiveStatus = "live"
    livekitRoom: str
    listenerCount: int = 0
    peakListenerCount: int = 0
    commentCount: int = 0
    speakerIds: list[PydanticObjectId] = Field(default_factory=list)
    moderatorIds: list[PydanticObjectId] = Field(default_factory=list)
    speakerRequestIds: list[PydanticObjectId] = Field(default_factory=list)
    """Redis yokken izleyici tekrar sayımını önlemek için (userId listesi)."""
    presenceIds: list[PydanticObjectId] = Field(default_factory=list)
    replayPostId: PydanticObjectId | None = None
    replayUrl: str | None = None
    egressId: str | None = None
    recordingStatus: RecordingStatus = "none"
    startedAt: datetime = Field(default_factory=datetime.utcnow)
    endedAt: datetime | None = None

    class Settings:
        name = "live_channels"
