import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../context";

export function useConversations() {
  const api = useApi();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.conversations.list(),
  });
}

export function useConversationMessages(conversationId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => api.conversations.messages(conversationId),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; mediaUrls?: string[] }) =>
      api.conversations.send(conversationId, payload.content, payload.mediaUrls),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateConversation() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => api.conversations.create(participantId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
