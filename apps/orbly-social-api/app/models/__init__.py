from app.models.user import User
from app.models.post import Post
from app.models.orbit import Orbit
from app.models.follow import Follow
from app.models.like import Like
from app.models.bookmark import Bookmark
from app.models.notification import Notification
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.live_channel import LiveChannel
from app.models.live_comment import LiveComment

ALL_DOCUMENTS = [
    User,
    Post,
    Orbit,
    Follow,
    Like,
    Bookmark,
    Notification,
    Conversation,
    Message,
    LiveChannel,
    LiveComment,
]
