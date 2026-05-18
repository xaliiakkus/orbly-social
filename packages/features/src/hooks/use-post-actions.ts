import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useApi } from "../context";

export function usePostLike(postId: string, initialLiked = false, initialCount = 0) {
  const api = useApi();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await api.posts.like(postId);
      else await api.posts.unlike(postId);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const toggle = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await mutation.mutateAsync(next);
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
  }, [liked, mutation]);

  return { liked, count, toggle, isPending: mutation.isPending };
}

export function usePostBookmark(postId: string, initial = false) {
  const api = useApi();
  const qc = useQueryClient();
  const [bookmarked, setBookmarked] = useState(initial);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await api.bookmarks.add(postId);
      else await api.bookmarks.remove(postId);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const toggle = useCallback(async () => {
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
