import type { ApiClient } from "@orbly/api-client";

import type { OfflineAction } from "./types";

export async function replayOfflineAction(api: ApiClient, action: OfflineAction): Promise<void> {
  switch (action.type) {
    case "posts.like":
      await api.posts.like(action.postId);
      return;
    case "posts.unlike":
      await api.posts.unlike(action.postId);
      return;
    case "users.follow":
      await api.users.follow(action.userId);
      return;
    case "users.unfollow":
      await api.users.unfollow(action.userId);
      return;
    case "posts.create":
      await api.posts.create(action.body);
      return;
    case "conversations.send":
      await api.conversations.send(action.conversationId, action.content, action.mediaUrls);
      return;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
