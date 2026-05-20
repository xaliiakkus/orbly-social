import { useMutation } from "@tanstack/react-query";

import { useOrbly } from "../context";

export function useStartConversation() {
  const { api } = useOrbly();
  return useMutation({
    mutationFn: (participantId: string) => api.conversations.create(participantId),
  });
}
