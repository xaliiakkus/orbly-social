import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { MessageItem, PaginatedResponse, PostPublic } from "@orbly/types";

import {
  buildPendingPost,
  isOfflinePostId,
  offlineMessageId,
  offlinePostId,
} from "./types";

type FeedPage = PaginatedResponse<PostPublic>;

export function prependPendingPostToFeeds(
  qc: QueryClient,
  clientId: string,
  body: Parameters<typeof buildPendingPost>[1],
  author: Parameters<typeof buildPendingPost>[2],
) {
  const post = buildPendingPost(clientId, body, author);
  const prepend = (old: InfiniteData<FeedPage> | undefined) => {
    if (!old?.pages?.length) {
      return {
        pages: [{ data: [post], nextCursor: null, hasMore: false }],
        pageParams: [undefined],
      };
    }
    const first = old.pages[0]!;
    if (first.data.some((p) => p.id === post.id)) return old;
    return {
      ...old,
      pages: [{ ...first, data: [post, ...first.data] }, ...old.pages.slice(1)],
    };
  };

  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, prepend);
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["profile-posts"] }, prepend);
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["orbit-posts"] }, prepend);

  if (body.replyToId) {
    qc.setQueryData<InfiniteData<FeedPage>>(["replies", body.replyToId], (old) => prepend(old));
  }
}

export function replaceOfflinePostInFeeds(
  qc: QueryClient,
  clientId: string,
  serverPost: PostPublic,
) {
  const pendingId = offlinePostId(clientId);
  const replace = (old: InfiniteData<FeedPage> | undefined) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.map((p) => (p.id === pendingId ? serverPost : p)),
      })),
    };
  };
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, replace);
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["profile-posts"] }, replace);
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["orbit-posts"] }, replace);
}

export function removeOfflinePostFromFeeds(qc: QueryClient, clientId: string) {
  const pendingId = offlinePostId(clientId);
  const remove = (old: InfiniteData<FeedPage> | undefined) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.filter((p) => p.id !== pendingId && !isOfflinePostId(p.id)),
      })),
    };
  };
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, remove);
}

export function appendPendingMessage(
  qc: QueryClient,
  conversationId: string,
  clientId: string,
  content: string,
  senderId: string,
  mediaUrls: string[] = [],
) {
  const item: MessageItem = {
    id: offlineMessageId(clientId),
    senderId,
    content,
    mediaUrls,
    isRead: true,
    createdAt: new Date().toISOString(),
  };
  qc.setQueryData<{ data: MessageItem[] }>(["messages", conversationId], (old) => {
    if (!old?.data) return { data: [item] };
    if (old.data.some((m) => m.id === item.id)) return old;
    return { data: [...old.data, item] };
  });
}

export function replacePendingMessage(
  qc: QueryClient,
  conversationId: string,
  clientId: string,
  serverMessage: MessageItem,
) {
  const pendingId = offlineMessageId(clientId);
  qc.setQueryData<{ data: MessageItem[] }>(["messages", conversationId], (old) => {
    if (!old?.data) return { data: [serverMessage] };
    const hasPending = old.data.some((m) => m.id === pendingId);
    if (!hasPending) {
      if (old.data.some((m) => m.id === serverMessage.id)) return old;
      return { data: [...old.data, serverMessage] };
    }
    return {
      data: old.data.map((m) => (m.id === pendingId ? serverMessage : m)),
    };
  });
}
