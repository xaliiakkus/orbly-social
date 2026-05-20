"use client";

import { useNotificationUnreadCount } from "@orbly/features";

import { cn } from "@/lib/cn";

export function NotificationNavBadge({ className }: { className?: string }) {
  const { data: unread = 0 } = useNotificationUnreadCount();
  if (!unread) return null;

  const label = unread > 99 ? "99+" : String(unread);

  return (
    <span
      className={cn(
        "absolute top-0.5 left-[calc(50%+10px)] min-w-[18px] h-[18px] px-1 rounded-full",
        "bg-accent text-white text-[11px] font-bold leading-[18px] text-center",
        className,
      )}
      aria-label={`${label} okunmamış bildirim`}
    >
      {label}
    </span>
  );
}
