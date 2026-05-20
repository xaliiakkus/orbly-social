"""
Keşfet / For-you sıralama — X open-source Heavy Ranker ağırlıklarına yakın heuristik.

Kaynak: https://github.com/twitter/the-algorithm (engagement ağırlıkları; replying yüksek öncelik).
Tüm gönderiler aday havuzunda; takip/ilgi alanı yalnızca boost (Keşfet’te zayıf boost).
"""

from __future__ import annotations

from datetime import datetime, timedelta

from beanie import PydanticObjectId

from app.models.orbit import Orbit

FOR_YOU_WINDOW_DAYS = 30
EXPLORE_WINDOW_DAYS = 14
TRENDING_POSTS_WINDOW_HOURS = 48

# X recap’a göre göreli önem (normalize edilmiş skaler)
LIKE_WEIGHT = 1.0
REPLY_WEIGHT = 5.5
REPOST_WEIGHT = 3.5
BOOKMARK_WEIGHT = 1.5
VIEW_WEIGHT = 0.08

TIME_DECAY_POWER = 1.45
TIME_DECAY_OFFSET_HOURS = 2.0
MIN_ENGAGEMENT = 0.5


def for_you_since() -> datetime:
    return datetime.utcnow() - timedelta(days=FOR_YOU_WINDOW_DAYS)


def explore_since() -> datetime:
    return datetime.utcnow() - timedelta(days=EXPLORE_WINDOW_DAYS)


def trending_posts_since() -> datetime:
    return datetime.utcnow() - timedelta(hours=TRENDING_POSTS_WINDOW_HOURS)


async def load_interest_orbits(orbit_ids: list[PydanticObjectId]) -> list[Orbit]:
    if not orbit_ids:
        return []
    return await Orbit.find({"_id": {"$in": orbit_ids}}).to_list()


def _ranking_stages(
    *,
    now: datetime,
    orbit_ids: list[PydanticObjectId],
    orbit_slugs: list[str],
    in_network: list[PydanticObjectId],
    discover_mode: bool,
    reply_emphasis: float,
) -> list[dict]:
    """Ortak $addFields + finalScore (takip etmese bile gönderiler aday)."""
    slug_list = orbit_slugs or []
    niche_orbit = 2.0 if discover_mode else 2.8
    niche_tag = 1.6 if discover_mode else 2.0
    in_network_boost = 1.08 if discover_mode else 1.25

    return [
        {
            "$addFields": {
                "engagementScore": {
                    "$add": [
                        {"$multiply": ["$stats.likeCount", LIKE_WEIGHT]},
                        {"$multiply": ["$stats.replyCount", REPLY_WEIGHT * reply_emphasis]},
                        {"$multiply": ["$stats.repostCount", REPOST_WEIGHT]},
                        {"$multiply": ["$stats.bookmarkCount", BOOKMARK_WEIGHT]},
                        {"$multiply": ["$stats.viewCount", VIEW_WEIGHT]},
                    ]
                },
                "discussionBoost": {
                    "$add": [
                        1,
                        {
                            "$min": [
                                {"$divide": [{"$ifNull": ["$stats.replyCount", 0]}, 6]},
                                5,
                            ]
                        },
                    ]
                },
                "ageHours": {
                    "$divide": [{"$subtract": [now, "$createdAt"]}, 3600000]
                },
                "nicheBoost": {
                    "$cond": [
                        {"$in": ["$orbitId", orbit_ids]},
                        niche_orbit,
                        {
                            "$cond": [
                                {
                                    "$gt": [
                                        {
                                            "$size": {
                                                "$setIntersection": [
                                                    {"$ifNull": ["$hashtags", []]},
                                                    slug_list,
                                                ]
                                            }
                                        },
                                        0,
                                    ]
                                },
                                niche_tag,
                                1.0,
                            ]
                        },
                    ]
                },
                "inNetworkBoost": {
                    "$cond": [{"$in": ["$authorId", in_network]}, in_network_boost, 1.0]
                },
            }
        },
        {
            "$addFields": {
                "finalScore": {
                    "$divide": [
                        {
                            "$multiply": [
                                {"$max": ["$engagementScore", MIN_ENGAGEMENT]},
                                "$discussionBoost",
                                "$nicheBoost",
                                "$inNetworkBoost",
                            ]
                        },
                        {
                            "$pow": [
                                {"$add": ["$ageHours", TIME_DECAY_OFFSET_HOURS]},
                                TIME_DECAY_POWER,
                            ]
                        },
                    ]
                }
            }
        },
    ]


def build_for_you_pipeline(
    *,
    user_id: str,
    orbit_ids: list[PydanticObjectId],
    orbit_slugs: list[str],
    following_ids: list[PydanticObjectId],
    since: datetime,
    skip: int,
    limit: int,
) -> list[dict]:
    user_oid = PydanticObjectId(user_id)
    in_network = following_ids + [user_oid]
    now = datetime.utcnow()

    match: dict = {
        "isDeleted": False,
        "replyToId": None,
        "createdAt": {"$gte": since},
    }

    return [
        {"$match": match},
        *_ranking_stages(
            now=now,
            orbit_ids=orbit_ids,
            orbit_slugs=orbit_slugs,
            in_network=in_network,
            discover_mode=False,
            reply_emphasis=1.0,
        ),
        {"$sort": {"finalScore": -1, "createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit + 1},
    ]


def build_explore_pipeline(
    *,
    user_id: str,
    orbit_ids: list[PydanticObjectId],
    orbit_slugs: list[str],
    following_ids: list[PydanticObjectId],
    since: datetime,
    skip: int,
    limit: int,
) -> list[dict]:
    """Keşfet Sana Özel: takip etmese bile yüksek etkileşim + tartışma öne çıkar."""
    user_oid = PydanticObjectId(user_id)
    in_network = following_ids + [user_oid]
    now = datetime.utcnow()

    match: dict = {
        "isDeleted": False,
        "replyToId": None,
        "createdAt": {"$gte": since},
    }

    return [
        {"$match": match},
        *_ranking_stages(
            now=now,
            orbit_ids=orbit_ids,
            orbit_slugs=orbit_slugs,
            in_network=in_network,
            discover_mode=True,
            reply_emphasis=1.15,
        ),
        {"$sort": {"finalScore": -1, "stats.replyCount": -1, "createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit + 1},
    ]


def build_explore_trending_posts_pipeline(
    *,
    since: datetime,
    skip: int,
    limit: int,
) -> list[dict]:
    """Gündemdekiler: son 48 saatte en çok konuşulan (yanıt) gönderiler."""
    now = datetime.utcnow()
    match: dict = {
        "isDeleted": False,
        "replyToId": None,
        "createdAt": {"$gte": since},
    }

    return [
        {"$match": match},
        *_ranking_stages(
            now=now,
            orbit_ids=[],
            orbit_slugs=[],
            in_network=[],
            discover_mode=True,
            reply_emphasis=1.35,
        ),
        {"$sort": {"stats.replyCount": -1, "finalScore": -1, "createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit + 1},
    ]


def build_trending_hashtags_pipeline(since: datetime, limit: int = 15) -> list[dict]:
    """Etiketler: gönderi sayısı + etkileşim ağırlıklı skor."""
    return [
        {"$match": {"createdAt": {"$gte": since}, "isDeleted": False}},
        {"$unwind": "$hashtags"},
        {
            "$group": {
                "_id": "$hashtags",
                "postCount": {"$sum": 1},
                "engagement": {
                    "$sum": {
                        "$add": [
                            {"$multiply": ["$stats.likeCount", LIKE_WEIGHT]},
                            {"$multiply": ["$stats.replyCount", REPLY_WEIGHT]},
                            {"$multiply": ["$stats.repostCount", REPOST_WEIGHT]},
                        ]
                    }
                },
            }
        },
        {
            "$addFields": {
                "score": {
                    "$add": [
                        "$postCount",
                        {"$multiply": ["$engagement", 0.15]},
                    ]
                }
            }
        },
        {"$sort": {"score": -1, "postCount": -1}},
        {"$limit": limit},
    ]


def strip_ranking_fields(doc: dict) -> None:
    for key in (
        "engagementScore",
        "discussionBoost",
        "ageHours",
        "nicheBoost",
        "inNetworkBoost",
        "finalScore",
        "score",
    ):
        doc.pop(key, None)


async def resolve_orbit_from_hashtags(hashtags: list[str]) -> PydanticObjectId | None:
    if not hashtags:
        return None
    orbit = await Orbit.find_one({"slug": {"$in": hashtags}})
    return orbit.id if orbit else None
