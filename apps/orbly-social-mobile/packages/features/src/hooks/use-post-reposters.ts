import { useInfiniteQuery } from "@tanstack/react-query";

import { useApi } from "../context";

export function usePostReposters(postId: string, enabled = false) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ["post-reposters", postId],
    enabled: enabled && !!postId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api.posts.reposters(postId, pageParam),
    getNextPageParam: (last) =>
      last.hasMore && last.nextCursor ? last.nextCursor : undefined,
  });
}
