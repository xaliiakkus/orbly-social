from __future__ import annotations

import logging
import time
from collections import defaultdict
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

_lock = Lock()
_totals: dict[str, int] = defaultdict(int)


def record(kind: str, count: int = 1) -> None:
    with _lock:
        _totals[kind] += count


def snapshot() -> dict[str, int | float]:
    with _lock:
        total = _totals.get("requests", 0)
        errors = _totals.get("errors_5xx", 0) + _totals.get("unhandled", 0)
        client = _totals.get("errors_4xx", 0)
        rate = round((errors / total) * 100, 2) if total else 0.0
        client_rate = round((client / total) * 100, 2) if total else 0.0
        return {
            **dict(_totals),
            "errorRatePercent": rate,
            "clientErrorRatePercent": client_rate,
        }


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in ("/health", "/health/metrics", "/openapi.json", "/docs", "/redoc"):
            return await call_next(request)

        start = time.perf_counter()
        record("requests")
        try:
            response = await call_next(request)
        except Exception:
            record("unhandled")
            logger.exception("Unhandled error %s %s", request.method, request.url.path)
            raise

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        if elapsed_ms > 3000:
            record("slow_requests")

        status = response.status_code
        if status >= 500:
            record("errors_5xx")
        elif status >= 400:
            record("errors_4xx")

        return response
