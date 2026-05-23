import type { MessageItem } from "@orbly/types";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useApi, useOrbly, useOrblyQueryClient } from "../context";
import { appendPendingMessage } from "../offline/cache-optimistic";
import { isQueueableError } from "../offline/network";
import { createClientId } from "../offline/queue-service";
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
  const { offlineQueue } = useOrbly();
  const qc = useOrblyQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      content: string;
      mediaUrls?: string[];
      senderId: string;
    }) => {
      const { content, mediaUrls, senderId } = payload;
      const hasMedia = (mediaUrls?.length ?? 0) > 0;

      if (offlineQueue?.isOffline()) {
        if (hasMedia) {
          throw new Error("Çevrimdışıyken yalnızca metin mesajı kaydedilebilir.");
        }
        const clientId = createClientId();
        await offlineQueue.enqueue({
          type: "conversations.send",
          conversationId,
          clientId,
          content,
          mediaUrls,
          senderId,
        });
        appendPendingMessage(qc, conversationId, clientId, content, senderId, mediaUrls ?? []);
        return { queued: true as const, clientId };
      }

      try {
        return await api.conversations.send(conversationId, content, mediaUrls);
      } catch (e) {
        if (offlineQueue && isQueueableError(e) && !hasMedia) {
          const clientId = createClientId();
          await offlineQueue.enqueue({
            type: "conversations.send",
            conversationId,
            clientId,
            content,
            mediaUrls,
            senderId,
          });
          appendPendingMessage(qc, conversationId, clientId, content, senderId, mediaUrls ?? []);
          return { queued: true as const, clientId };
        }
        throw e;
      }
    },
    onSuccess: (result) => {
      if (!result || "queued" in result) return;
      const msg = result.message;
      qc.setQueryData<{ data: MessageItem[] }>(
        ["messages", conversationId],
        (old) => {
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
