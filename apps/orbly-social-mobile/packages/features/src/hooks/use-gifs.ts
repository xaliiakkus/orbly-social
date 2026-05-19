import { useQuery } from "@tanstack/react-query";

import { useApi } from "../context";

export function useGifSearch(query: string, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: ["gifs", query],
    queryFn: () => api.media.gifs(query),
    enabled,
    staleTime: 60_000,
  });
}
