import type { PostPublic, UserPublic } from "@orbly/types";

export type OfflineAction =
  | { type: "posts.like"; postId: string }
  | { type: "posts.unlike"; postId: string }
  | { type: "users.follow"; userId: string }
  | { type: "users.unfollow"; userId: string }
  | {
      type: "posts.create";
      clientId: string;
      body: {
        content: string;
        mediaUrls?: string[];
        replyToId?: string;
        orbitId?: string;
        poll?: { options: string[]; durationHours?: number };
      };
      author: UserPublic;
    }
  | {
      type: "conversations.send";
      conversationId: string;
      clientId: string;
      content: string;
      mediaUrls?: string[];
      senderId: string;
    };

export type OfflineQueueItem = {
  id: string;
  userId: string;
  action: OfflineAction;
  createdAt: string;
};

export type OfflineStore = {
  load: (userId: string) => Promise<OfflineQueueItem[]>;
  save: (userId: string, items: OfflineQueueItem[]) => Promise<void>;
};

export type OfflineQueueBridge = {
  isOffline: () => boolean;
  enqueue: (action: OfflineAction) => Promise<void>;
  getPendingCount: () => Promise<number>;
};

export const OFFLINE_POST_ID_PREFIX = "offline:";
export const OFFLINE_MESSAGE_ID_PREFIX = "offline:";

export function offlinePostId(clientId: string) {
  return `${OFFLINE_POST_ID_PREFIX}${clientId}`;
}

export function offlineMessageId(clientId: string) {
  return `${OFFLINE_MESSAGE_ID_PREFIX}${clientId}`;
}

export function isOfflinePostId(id: string) {
  return id.startsWith(OFFLINE_POST_ID_PREFIX);
}

export function buildPendingPost(
  clientId: string,
  body: Extract<OfflineAction, { type: "posts.create" }>["body"],
  author: UserPublic,
): PostPublic {
  const now = new Date().toISOString();
  return {
    id: offlinePostId(clientId),
    content: body.content,
    mediaUrls: body.mediaUrls ?? [],
    author,
    hashtags: [],
    replyToId: body.replyToId,
    stats: {
      likeCount: 0,
      replyCount: 0,
      repostCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
    },
    likedByMe: false,
    bookmarkedByMe: false,
    repostedByMe: false,
    createdAt: now,
    updatedAt: now,
  };
}
