import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { PaginatedResponse, PostPublic } from "@orbly/types";

import type { PostStatsEvent } from "./types";

type FeedPage = PaginatedResponse<PostPublic>;

/** API feed kartı — gömülü repost ve kullanıcı repost bayrakları */
type PostWithRepostEmbed = PostPublic & {
  repostOf?: PostPublic;
  repostedByMe?: boolean;
  myRepostId?: string;
};

function patchPostInPages(
  pages: FeedPage[],
  postId: string,
  patch: Partial<PostPublic>,
): FeedPage[] {
  return pages.map((page) => ({
    ...page,
    data: page.data.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
  }));
}

function filterPostFromPages(pages: FeedPage[], postId: string): FeedPage[] {
  return pages.map((page) => ({
    ...page,
    data: page.data.filter((p) => p.id !== postId),
  }));
}

export function removePostFromCache(qc: QueryClient, postId: string) {
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, (old) => {
    if (!old?.pages) return old;
    return { ...old, pages: filterPostFromPages(old.pages, postId) };
  });
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["profile-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: filterPostFromPages(old.pages, postId) };
    },
  );
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["orbit-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: filterPostFromPages(old.pages, postId) };
    },
  );
  qc.removeQueries({ queryKey: ["post", postId] });
}

export function applyPostUpdateToCache(qc: QueryClient, updated: PostPublic) {
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, (old) => {
    if (!old?.pages) return old;
    return { ...old, pages: patchPostInPages(old.pages, updated.id, updated) };
  });
  qc.setQueriesData<{ post: PostPublic }>({ queryKey: ["post", updated.id] }, () => ({
    post: updated,
  }));
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["profile-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: patchPostInPages(old.pages, updated.id, updated) };
    },
  );
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["orbit-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: patchPostInPages(old.pages, updated.id, updated) };
    },
  );
}

export function applyPostRepostToCache(
  qc: QueryClient,
  targetPostId: string,
  patch: {
    repostedByMe: boolean;
    myRepostId: string | null;
    repostCount: number;
  },
) {
  const applyToPost = (raw: PostPublic): PostPublic => {
    const p = raw as PostWithRepostEmbed;
    const isTarget = p.id === targetPostId;
    const embedTarget =
      p.repostOf?.id === targetPostId || p.repostOfId === targetPostId;
    if (!isTarget && !embedTarget) return raw;
    const next: PostWithRepostEmbed = {
      ...p,
      repostedByMe: patch.repostedByMe,
      myRepostId: patch.myRepostId ?? undefined,
    };
    if (isTarget) {
      next.stats = { ...p.stats, repostCount: patch.repostCount };
    }
    if (p.repostOf && embedTarget) {
      next.repostOf = {
        ...p.repostOf,
        stats: { ...p.repostOf.stats, repostCount: patch.repostCount },
        repostedByMe: patch.repostedByMe,
        myRepostId: patch.myRepostId ?? undefined,
      };
    }
    return next;
  };

  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.map(applyToPost),
      })),
    };
  });
  qc.setQueriesData<{ post: PostPublic }>({ queryKey: ["post", targetPostId] }, (old) => {
    if (!old?.post) return old;
    return { post: applyToPost(old.post) };
  });
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["profile-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map(applyToPost),
        })),
      };
    },
  );
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["orbit-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map(applyToPost),
        })),
      };
    },
  );
}

export function applyPostLikeToCache(qc: QueryClient, postId: string, liked: boolean) {
  const patch = { likedByMe: liked };
  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, (old) => {
    if (!old?.pages) return old;
    return { ...old, pages: patchPostInPages(old.pages, postId, patch) };
  });
  qc.setQueriesData<{ post: PostPublic }>({ queryKey: ["post", postId] }, (old) => {
    if (!old?.post) return old;
    return { post: { ...old.post, ...patch } };
  });
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["profile-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: patchPostInPages(old.pages, postId, patch) };
    },
  );
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["orbit-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: patchPostInPages(old.pages, postId, patch) };
    },
  );
}

export function applyPostStatsToCache(
  qc: QueryClient,
  event: PostStatsEvent,
  viewerId?: string | null,
) {
  const patch: Partial<PostPublic> = { stats: event.stats };
  if (viewerId && event.actorId === viewerId) {
    if (event.action === "like") patch.likedByMe = true;
    else if (event.action === "unlike") patch.likedByMe = false;
  }

  qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed"] }, (old) => {
    if (!old?.pages) return old;
    return { ...old, pages: patchPostInPages(old.pages, event.postId, patch) };
  });

  qc.setQueriesData<{ post: PostPublic }>({ queryKey: ["post", event.postId] }, (old) => {
    if (!old?.post) return old;
    return { post: { ...old.post, ...patch } };
  });

  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["profile-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: patchPostInPages(old.pages, event.postId, patch) };
    },
  );
  qc.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: ["orbit-posts"] },
    (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: patchPostInPages(old.pages, event.postId, patch) };
    },
  );
}

