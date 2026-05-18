import { useInfiniteQuery } from "@tanstack/react-query";

import { useApi } from "../context";

export type FeedMode = "for-you" | "following";

export function useFeed(mode: FeedMode) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ["feed", mode],
    queryFn: ({ pageParam }) =>
      mode === "for-you"
        ? api.feed.forYou(pageParam as string | undefined)
        : api.feed.following(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  });
}
