import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationItem } from "@orbly/types";

import { useApi } from "../context";
import { syncConversationsUnreadCount } from "../realtime/conversation-cache";

function countUnreadConversations(list: ConversationItem[]): number {
  return list.filter((c) => c.unreadCount > 0).length;
}

/** Okunmamış sohbet sayısı — socket önbelleği + ilk açılışta tek HTTP bootstrap */
export function useConversationsUnreadCount(options?: { enabled?: boolean }) {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["conversations", "unread-count"],
    queryFn: async () => {
      const badge = qc.getQueryData<number>(["conversations", "unread-count"]);
      if (typeof badge === "number") return badge;
      const cached = qc.getQueryData<{ data: ConversationItem[] }>(["conversations"]);
      if (cached?.data?.length) {
        const n = countUnreadConversations(cached.data);
        syncConversationsUnreadCount(qc);
        return n;
      }
      const res = await api.conversations.list();
      qc.setQueryData(["conversations"], res);
      const n = countUnreadConversations(res.data ?? []);
      qc.setQueryData(["conversations", "unread-count"], n);
      return n;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
