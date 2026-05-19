import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi, useOrblyQueryClient } from "../context";

export function useLiveList() {
  const api = useApi();
  return useQuery({
    queryKey: ["live"],
    queryFn: () => api.live.list(),
    refetchInterval: 20_000,
  });
}

export function useLiveChannel(channelId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["live", channelId],
    queryFn: () => api.live.get(channelId),
    enabled: !!channelId,
    refetchInterval: (q) => (q.state.data?.channel.status === "live" ? 30_000 : false),
  });
}

export function useLiveComments(channelId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["live", channelId, "comments"],
    queryFn: () => api.live.comments(channelId),
    enabled: !!channelId,
  });
}

export function useEndLive() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => api.live.end(channelId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["live"] });
    },
  });
}
