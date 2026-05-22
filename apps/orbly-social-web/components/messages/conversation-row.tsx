"use client";

import { formatConversationPreview } from "@orbly/features";
import { BadgeCheck, ImageIcon } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ConversationItem } from "@orbly/types";

export function ConversationRow({
  conversation: c,
  viewerId,
  active,
}: {
  conversation: ConversationItem;
  viewerId?: string | null;
  active?: boolean;
}) {
  const unread = c.unreadCount > 0;
  const preview = formatConversationPreview(c.lastMessage, viewerId);
  const isMediaPreview =
    preview.includes("📷") || preview.includes("📎");

  return (
    <Link
      href={`/messages/${c.id}`}
      className={cn(
        "flex gap-3 px-4 py-3.5 transition-colors border-b border-border/60",
        "hover:bg-bg-hover/80",
        unread && "bg-accent/[0.07]",
        active && "bg-bg-hover",
      )}
    >
      <div className="relative shrink-0">
        {c.participant ? (
          <Avatar
            src={c.participant.avatarUrl}
            name={c.participant.displayName}
            size="lg"
            className={cn(
              "h-12 w-12 ring-2 ring-offset-2 ring-offset-bg-primary",
              unread ? "ring-accent/50" : "ring-border/40",
            )}
          />
        ) : (
          <span className="h-12 w-12 rounded-full bg-bg-secondary border border-border block" />
        )}
        {unread ? (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-accent border-2 border-bg-primary" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className={cn(
              "truncate text-[16px]",
              unread ? "font-extrabold text-text-primary" : "font-bold text-text-primary",
            )}
          >
            {c.participant?.displayName ?? "Sohbet"}
          </p>
          {c.participant?.verified ? (
            <BadgeCheck className="h-4 w-4 text-accent shrink-0 fill-accent/20" />
          ) : null}
          {c.lastMessage?.createdAt ? (
            <time
              className={cn(
                "ml-auto shrink-0 text-[13px] tabular-nums",
                unread ? "text-accent font-semibold" : "text-text-secondary",
              )}
            >
              {formatRelativeTime(c.lastMessage.createdAt)}
            </time>
          ) : null}
        </div>
        {c.participant?.username ? (
          <p className="text-[13px] text-text-secondary truncate">@{c.participant.username}</p>
        ) : null}
        <p
          className={cn(
            "text-[15px] truncate mt-1 flex items-center gap-1.5",
            unread ? "text-text-primary font-medium" : "text-text-secondary",
          )}
        >
          {isMediaPreview ? (
            <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
          ) : null}
          <span className="truncate">{preview}</span>
        </p>
      </div>

      {unread ? (
        <span className="bg-accent text-white text-[12px] font-bold h-6 min-w-6 px-2 rounded-full flex items-center justify-center shrink-0 self-center shadow-sm shadow-accent/30">
          {c.unreadCount > 99 ? "99+" : c.unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
