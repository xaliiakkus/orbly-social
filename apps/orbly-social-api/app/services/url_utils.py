"""Harici URL'ler — production'da HTTPS zorunlu (mixed content)."""

from __future__ import annotations

from app.config import settings


def https_public_url(url: str | None) -> str | None:
    if not url or not url.startswith("http://"):
        return url
    if settings.node_env != "production":
        return url
    host = url[7:].split("/")[0].lower()
    if host in ("localhost", "127.0.0.1") or host.endswith(".local"):
        return url
    return "https://" + url[7:]


def https_public_urls(urls: list[str] | None) -> list[str]:
    if not urls:
        return []
    return [https_public_url(u) or u for u in urls]
