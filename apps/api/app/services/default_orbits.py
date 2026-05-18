from app.models.orbit import Orbit, OrbitStats

DEFAULT_ORBITS = [
    {"slug": "tech", "name": "Tech", "description": "Yazılım, donanım ve startup"},
    {"slug": "design", "name": "Design", "description": "UI/UX ve ürün tasarımı"},
    {"slug": "gaming", "name": "Gaming", "description": "Oyun ve e-spor"},
    {"slug": "music", "name": "Music", "description": "Müzik ve prodüksiyon"},
    {"slug": "fitness", "name": "Fitness", "description": "Spor ve wellness"},
    {"slug": "crypto", "name": "Crypto", "description": "Blockchain ve Web3"},
]


async def ensure_default_orbits() -> int:
    """Veritabanında orbit yoksa varsayılanları ekler."""
    count = await Orbit.count()
    if count > 0:
        return count
    for o in DEFAULT_ORBITS:
        await Orbit(
            slug=o["slug"],
            name=o["name"],
            description=o["description"],
            stats=OrbitStats(),
        ).insert()
    return len(DEFAULT_ORBITS)
