import type { PostPublic } from "@orbly/types";

export interface RealtimeSocket {
  connected: boolean;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, data?: unknown): void;
}

export interface PostStatsEvent {
  postId: string;
  stats: PostPublic["stats"];
  actorId: string;
  action: string;
}

export interface PostReplyEvent {
  parentId: string;
  reply: PostPublic;
  actorId: string;
}

export interface MessageEvent {
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    content: string;
    mediaUrls: string[];
    isRead: boolean;
    createdAt: string;
  };
}

export interface UserActionEvent {
  action: string;
  actorId: string;
  following?: boolean;
  actor?: unknown;
}
