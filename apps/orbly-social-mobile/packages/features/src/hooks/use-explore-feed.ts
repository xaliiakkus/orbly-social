import { useInfiniteQuery } from "@tanstack/react-query";

import { useApi } from "../context";

export type ExploreFeedTab = "for-you" | "trending";

export function useExploreFeed(tab: ExploreFeedTab, options?: { enabled?: boolean }) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ["explore-feed", tab],
    queryFn: ({ pageParam }) =>
      api.feed.explore(tab, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
    enabled: options?.enabled ?? true,
  });
}
