import type { QueryClient } from "@tanstack/react-query";
import type { ConversationItem, MessageItem } from "@orbly/types";

import type { MessageEvent } from "./types";

function countUnreadConversations(list: ConversationItem[]): number {
  return list.filter((c) => c.unreadCount > 0).length;
}

export function setConversationsUnreadCount(qc: QueryClient, count: number) {
  qc.setQueryData(["conversations", "unread-count"], count);
}

export function syncConversationsUnreadCount(qc: QueryClient) {
  const list = qc.getQueryData<{ data: ConversationItem[] }>(["conversations"]);
  if (!list?.data) return;
  setConversationsUnreadCount(qc, countUnreadConversations(list.data));
}

export function markConversationReadInCache(qc: QueryClient, conversationId: string) {
  const prev = qc.getQueryData<{ data: ConversationItem[] }>(["conversations"]);
  if (!prev?.data) return;
  const hadUnread = prev.data.some((c) => c.id === conversationId && c.unreadCount > 0);
  if (!hadUnread) return;
  qc.setQueryData<{ data: ConversationItem[] }>(["conversations"], {
    data: prev.data.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c,
    ),
  });
  syncConversationsUnreadCount(qc);
}

/** Socket `message` — liste + rozet; HTTP invalidate yok */
export function applyMessageToConversationCache(
  qc: QueryClient,
  event: MessageEvent,
  viewerId: string | null,
) {
  const { conversationId, message } = event;
  const isIncoming = !!viewerId && message.senderId !== viewerId;

  qc.setQueryData<{ data: MessageItem[] }>(["messages", conversationId], (old) => {
    const item: MessageItem = {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      mediaUrls: message.mediaUrls ?? [],
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
    if (!old?.data) return { data: [item] };
    if (old.data.some((m) => m.id === item.id)) return old;
    return { data: [...old.data, item] };
  });

  const prev = qc.getQueryData<{ data: ConversationItem[] }>(["conversations"]);
  if (!prev?.data?.length) {
    if (isIncoming) {
      qc.setQueryData<number>(["conversations", "unread-count"], (old) =>
        typeof old === "number" ? old + 1 : 1,
      );
    }
    return;
  }

  const idx = prev.data.findIndex((c) => c.id === conversationId);
  if (idx === -1) {
    if (isIncoming) {
      qc.setQueryData<number>(["conversations", "unread-count"], (old) =>
        typeof old === "number" ? old + 1 : 1,
      );
    }
    return;
  }

  const conv = prev.data[idx]!;
  const updated: ConversationItem = {
    ...conv,
    lastMessage: {
      content: message.content,
      senderId: message.senderId,
      createdAt: message.createdAt,
    },
    updatedAt: message.createdAt,
    unreadCount: isIncoming ? conv.unreadCount + 1 : conv.unreadCount,
  };
  const next = [...prev.data];
  next.splice(idx, 1);
  next.unshift(updated);
  qc.setQueryData<{ data: ConversationItem[] }>(["conversations"], { data: next });
  syncConversationsUnreadCount(qc);
}
