"use client";

import { useConversationsUnreadCount } from "@orbly/features";

import { CountBadge } from "@/components/ui/count-badge";

export function MessageNavBadge({ className }: { className?: string }) {
  const { data: unread = 0 } = useConversationsUnreadCount();
  return (
    <CountBadge
      count={unread}
      className={className}
      ariaLabelPrefix="okunmamış mesaj"
    />
  );
}
