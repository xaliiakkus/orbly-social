import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi, useOrblyQueryClient } from "../context";

export function useNotifications(options?: { enabled?: boolean }) {
  const api = useApi();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
    enabled: options?.enabled ?? true,
  });
}

export function useReadAllNotifications() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.readAll(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
