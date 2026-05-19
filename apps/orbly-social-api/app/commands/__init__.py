"""Registers socket command handlers on import."""

from app.commands import (  # noqa: F401
    auth_cmds,
    bookmarks_cmds,
    conversations_cmds,
    live_cmds,
    media_cmds,
    notifications_cmds,
    orbits_cmds,
    posts_cmds,
    users_cmds,
)
