import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApi, useOrblyQueryClient } from "../context";
import { applyPostLikeToCache } from "../realtime/cache";

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

export function usePostView(postId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: () => api.posts.view(postId),
  });
}
