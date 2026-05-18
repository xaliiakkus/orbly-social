from __future__ import annotations

from typing import Any


def to_jsonable(data: Any) -> Any:
    if data is None:
        return None
    if hasattr(data, "model_dump"):
        return data.model_dump(mode="json")
    if isinstance(data, dict):
        return {k: to_jsonable(v) for k, v in data.items()}
    if isinstance(data, list):
        return [to_jsonable(x) for x in data]
    return data
