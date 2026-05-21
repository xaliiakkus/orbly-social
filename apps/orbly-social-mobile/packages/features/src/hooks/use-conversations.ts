import type { MessageItem } from "@orbly/types";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi, useOrblyQueryClient } from "../context";
import {
  markConversationReadInCache,
  syncConversationsUnreadCount,
} from "../realtime/conversation-cache";

export function useConversations() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.conversations.list();
      qc.setQueryData(["conversations"], res);
      syncConversationsUnreadCount(qc);
      return res;
    },
  });
}

export function useConversationMessages(conversationId: string) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await api.conversations.messages(conversationId);
      markConversationReadInCache(qc, conversationId);
      return res;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; mediaUrls?: string[] }) =>
      api.conversations.send(conversationId, payload.content, payload.mediaUrls),
    onSuccess: (result) => {
      qc.setQueryData<{ data: MessageItem[] }>(
        ["messages", conversationId],
        (old) => {
          const msg = result.message;
          if (!old?.data) return { data: [msg] };
          if (old.data.some((m) => m.id === msg.id)) return old;
          return { data: [...old.data, msg] };
        },
      );
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateConversation() {
  const api = useApi();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => api.conversations.create(participantId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
