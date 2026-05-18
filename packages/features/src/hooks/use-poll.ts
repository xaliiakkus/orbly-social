import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../context";

export function usePollVote(postId: string) {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (optionId: string) => api.posts.votePoll(postId, optionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
