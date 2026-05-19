"""For-you feed: tüm gönderiler aday havuzunda; ilgi alanı ve takip sıralamada öne çıkar."""

from __future__ import annotations

from datetime import datetime, timedelta

from beanie import PydanticObjectId

from app.models.orbit import Orbit

FOR_YOU_WINDOW_DAYS = 30


def for_you_since() -> datetime:
    return datetime.utcnow() - timedelta(days=FOR_YOU_WINDOW_DAYS)


async def load_interest_orbits(orbit_ids: list[PydanticObjectId]) -> list[Orbit]:
    if not orbit_ids:
        return []
    return await Orbit.find({"_id": {"$in": orbit_ids}}).to_list()


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
    slug_list = orbit_slugs or []
    now = datetime.utcnow()

    # Tüm gönderiler aday — orbit/takip sadece skor boost (sert filtre yok)
    match: dict = {
        "isDeleted": False,
        "replyToId": None,
        "createdAt": {"$gte": since},
    }

    return [
        {"$match": match},
        {
            "$addFields": {
                "engagementScore": {
                    "$add": [
                        {"$multiply": ["$stats.likeCount", 1.0]},
                        {"$multiply": ["$stats.replyCount", 2.0]},
                        {"$multiply": ["$stats.repostCount", 3.0]},
                        {"$multiply": ["$stats.bookmarkCount", 1.5]},
                    ]
                },
                "ageHours": {
                    "$divide": [{"$subtract": [now, "$createdAt"]}, 3600000]
                },
                "nicheBoost": {
                    "$cond": [
                        {"$in": ["$orbitId", orbit_ids]},
                        2.8,
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
                                2.0,
                                1.0,
                            ]
                        },
                    ]
                },
                "inNetworkBoost": {
                    "$cond": [{"$in": ["$authorId", in_network]}, 1.25, 1.0]
                },
            }
        },
        {
            "$addFields": {
                "finalScore": {
                    "$divide": [
                        {
                            "$multiply": [
                                {"$max": ["$engagementScore", 0.5]},
                                "$nicheBoost",
                                "$inNetworkBoost",
                            ]
                        },
                        {"$pow": [{"$add": ["$ageHours", 2]}, 1.4]},
                    ]
                }
            }
        },
        {"$sort": {"finalScore": -1, "createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit + 1},
    ]


def strip_ranking_fields(doc: dict) -> None:
    for key in (
        "engagementScore",
        "ageHours",
        "nicheBoost",
        "inNetworkBoost",
        "finalScore",
    ):
        doc.pop(key, None)


async def resolve_orbit_from_hashtags(hashtags: list[str]) -> PydanticObjectId | None:
    if not hashtags:
        return None
    orbit = await Orbit.find_one({"slug": {"$in": hashtags}})
    return orbit.id if orbit else None
