import { isRpcTransportError, warnRpcTransportError } from "@orbly/api-client";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApi, useOrblyQueryClient } from "../context";
import { applyPostLikeToCache, applyPostViewCountToCache } from "../realtime/cache";

/** Oturum içi: aynı kullanıcı + gönderi için tek RPC */
const sessionRecordedViews = new Set<string>();

function viewSessionKey(viewerId: string, postId: string) {
  return `${viewerId}:${postId}`;
}

export function usePostLike(postId: string, initialLiked = false, initialCount = 0) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  const busyRef = useRef(false);
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    busyRef.current = false;
    setLiked(initialLiked);
    setCount(initialCount);
  }, [postId]);

  useEffect(() => {
    if (busyRef.current) return;
    setLiked(initialLiked);
  }, [initialLiked, postId]);

  useEffect(() => {
    if (busyRef.current) return;
    setCount(initialCount);
  }, [initialCount, postId]);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await api.posts.like(postId);
      else await api.posts.unlike(postId);
    },
    onSuccess: (_data, next) => {
      applyPostLikeToCache(qc, postId, next);
    },
  });

  const toggle = useCallback(async () => {
    if (busyRef.current || mutation.isPending) return;

    const next = !liked;
    busyRef.current = true;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    try {
      await mutation.mutateAsync(next);
    } catch {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      busyRef.current = false;
    }
  }, [liked, mutation, postId]);

  return { liked, count, toggle, isPending: mutation.isPending };
}

export function usePostBookmark(postId: string, initial = false) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  const [bookmarked, setBookmarked] = useState(initial);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await api.bookmarks.add(postId);
      else await api.bookmarks.remove(postId);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const toggle = useCallback(async () => {
    if (mutation.isPending) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await mutation.mutateAsync(next);
    } catch {
      setBookmarked(!next);
    }
  }, [bookmarked, mutation]);

  return { bookmarked, toggle };
}

export type PostViewResult = {
  success: boolean;
  counted?: boolean;
  viewCount?: number;
};

/**
 * Görüntülenme — sunucuda kullanıcı başına bir kez; istemcide oturumda tek istek.
 */
export function usePostView(postId: string, viewerId?: string | null, authorId?: string | null) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  const pendingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: () => api.posts.view(postId),
    onSuccess: (res: PostViewResult) => {
      if (viewerId && postId) {
        sessionRecordedViews.add(viewSessionKey(viewerId, postId));
      }
      if (res.counted && typeof res.viewCount === "number") {
        applyPostViewCountToCache(qc, postId, res.viewCount);
      }
    },
  });

  const recordView = useCallback(() => {
    if (!viewerId || !postId) return;
    if (authorId && viewerId === authorId) return;
    const key = viewSessionKey(viewerId, postId);
    if (sessionRecordedViews.has(key) || pendingRef.current) return;
    pendingRef.current = true;
    void mutation
      .mutateAsync()
      .catch((err) => {
        if (isRpcTransportError(err)) warnRpcTransportError(err, "posts.view");
      })
      .finally(() => {
        pendingRef.current = false;
      });
  }, [viewerId, authorId, postId, mutation]);

  return {
    recordView,
    /** @deprecated use recordView */
    mutate: recordView,
    isPending: mutation.isPending,
  };
}
