import { useMutation } from "@tanstack/react-query";
import type { PostPublic } from "@orbly/types";

import { POST_MAX_LENGTH } from "../constants";
import { useApi, useOrblyQueryClient } from "../context";
import { applyPostUpdateToCache, removePostFromCache } from "../realtime/cache";

export function useDeletePost() {
  const api = useApi();
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.posts.delete(postId),
    onSuccess: (_data, postId) => {
      removePostFromCache(qc, postId);
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["profile-posts"] });
      void qc.invalidateQueries({ queryKey: ["orbit-posts"] });
    },
  });
}

export function useUpdatePost() {
  const api = useApi();
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      content,
      mediaUrls,
    }: {
      postId: string;
      content: string;
      mediaUrls?: string[];
    }) =>
      api.posts.update(postId, {
        content: content.trim().slice(0, POST_MAX_LENGTH),
        mediaUrls: mediaUrls ?? [],
      }),
    onSuccess: (data) => {
      applyPostUpdateToCache(qc, data.post);
    },
  });
}

/** Kendi gönderisi mi (yeniden paylaşım hariç düzenlenebilir). */
export function canManagePost(post: PostPublic, viewerId?: string | null) {
  if (!viewerId || post.author.id !== viewerId) return false;
  return !post.repostOfId;
}
