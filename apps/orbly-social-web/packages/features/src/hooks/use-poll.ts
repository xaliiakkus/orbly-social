import { useMutation } from "@tanstack/react-query";

import { useApi, useOrblyQueryClient } from "../context";

export function usePollVote(postId: string) {
  const api = useApi();
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: (optionId: string) => api.posts.votePoll(postId, optionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
