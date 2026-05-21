"use client";

import { useNotificationUnreadCount } from "@orbly/features";

import { CountBadge } from "@/components/ui/count-badge";

export function NotificationNavBadge({ className }: { className?: string }) {
  const { data: unread = 0 } = useNotificationUnreadCount();
  return (
    <CountBadge
      count={unread}
      className={className}
      ariaLabelPrefix="okunmamış bildirim"
    />
  );
}
