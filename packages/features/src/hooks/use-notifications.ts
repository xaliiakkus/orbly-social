import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../context";

export function useNotifications() {
  const api = useApi();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
  });
}

export function useReadAllNotifications() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.readAll(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
