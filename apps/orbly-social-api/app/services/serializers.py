from datetime import datetime

from beanie import Document

from app.models.orbit import Orbit
from app.models.post import Post
from app.models.user import User
from app.schemas.common import OrbitOut, PollOptionOut, PollOut, PostOut, PostStatsOut, UserOut, UserStatsOut


def _ts(doc: Document, field: str = "createdAt") -> str:
    from datetime import datetime

    t = getattr(doc, field, None)
    if t is None and hasattr(doc, "id") and doc.id:
        return doc.id.generation_time.isoformat().replace("+00:00", "Z")
    if t is None:
        return datetime.utcnow().isoformat() + "Z"
    return t.isoformat().replace("+00:00", "Z") if hasattr(t, "isoformat") else str(t)


def user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        username=user.username,
        displayName=user.displayName,
        bio=user.bio,
        avatarUrl=user.avatarUrl,
        bannerUrl=user.bannerUrl,
        location=user.location,
        website=user.website,
        verified=user.verified,
        isPrivate=user.isPrivate,
        onboarded=user.onboarded,
        orbitIds=[str(x) for x in (user.orbitIds or [])],
        stats=UserStatsOut(
            followersCount=user.stats.followersCount,
            followingCount=user.stats.followingCount,
            postsCount=user.stats.postsCount,
        ),
        createdAt=_ts(user),
    )


def orbit_out(orbit: Orbit) -> OrbitOut:
    return OrbitOut(
        id=str(orbit.id),
        slug=orbit.slug,
        name=orbit.name,
        description=orbit.description,
        iconUrl=orbit.iconUrl,
        bannerUrl=orbit.bannerUrl,
        stats={"memberCount": orbit.stats.memberCount, "postCount": orbit.stats.postCount},
    )


def poll_out(post: Post, viewer_id: str | None = None) -> PollOut | None:
    if not post.poll:
        return None
    total = post.poll.totalVotes or 0
    voted = post.pollVotes.get(viewer_id) if viewer_id else None
    ended = post.poll.endsAt <= datetime.utcnow()
    options = []
    for opt in post.poll.options:
        pct = (opt.voteCount / total * 100) if total else 0
        options.append(
            PollOptionOut(id=opt.id, text=opt.text, voteCount=opt.voteCount, percent=round(pct, 1))
        )
    return PollOut(
        options=options,
        endsAt=post.poll.endsAt.isoformat().replace("+00:00", "Z"),
        totalVotes=total,
        votedOptionId=voted,
        ended=ended,
    )


def post_out(
    post: Post,
    author: User,
    orbit: Orbit | None = None,
    *,
    liked_by_me: bool | None = None,
    bookmarked_by_me: bool | None = None,
    viewer_id: str | None = None,
) -> PostOut:
    return PostOut(
        id=str(post.id),
        content=post.content,
        mediaUrls=post.mediaUrls or [],
        author=user_out(author),
        orbit=orbit_out(orbit) if orbit else None,
        liveBroadcastId=str(post.liveBroadcastId) if post.liveBroadcastId else None,
        replyToId=str(post.replyToId) if post.replyToId else None,
        repostOfId=str(post.repostOfId) if post.repostOfId else None,
        hashtags=post.hashtags or [],
        poll=poll_out(post, viewer_id),
        stats=PostStatsOut(
            likeCount=post.stats.likeCount,
            replyCount=post.stats.replyCount,
            repostCount=post.stats.repostCount,
            bookmarkCount=post.stats.bookmarkCount,
            viewCount=post.stats.viewCount,
        ),
        likedByMe=liked_by_me,
        bookmarkedByMe=bookmarked_by_me,
        createdAt=_ts(post),
        updatedAt=_ts(post, "updatedAt"),
    )
