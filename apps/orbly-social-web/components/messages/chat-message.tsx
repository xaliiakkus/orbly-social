"use client";

import {
  formatMessageTime,
  isGroupedWithPrevious,
  isMessageMine,
  resolveMessageSender,
  shouldShowMessageAvatar,
  shouldShowSenderLabel,
} from "@orbly/features";
import { Check, CheckCheck } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/cn";
import type { MessageItem, UserPublic } from "@orbly/types";

export function ChatMessage({
  message,
  me,
  other,
  allMessages,
  messageIndex,
}: {
  message: MessageItem;
  me: UserPublic | null | undefined;
  other: UserPublic | null | undefined;
  allMessages: MessageItem[];
  messageIndex: number;
}) {
  const mine = isMessageMine(message.senderId, me?.id);
  const sender = resolveMessageSender(message, me, other);
  const showAvatar = shouldShowMessageAvatar(allMessages, messageIndex);
  const showLabel = shouldShowSenderLabel(allMessages, messageIndex);
  const grouped = isGroupedWithPrevious(allMessages, messageIndex);
  const hasText =
    !!message.content?.trim() && message.content.trim() !== "📎";

  const bubbleClass = mine
    ? cn(
        "rounded-2xl bg-gradient-to-br from-accent to-accent/90 text-white px-4 py-2.5 shadow-md shadow-accent/20",
        grouped ? "rounded-tr-lg mt-0.5" : "rounded-tr-md mt-1",
        showAvatar ? "rounded-br-md" : "rounded-br-lg",
      )
    : cn(
        "rounded-2xl bg-bg-secondary border border-border/70 px-4 py-2.5 shadow-sm",
        grouped ? "rounded-tl-lg mt-0.5" : "rounded-tl-md mt-1",
        showAvatar ? "rounded-bl-md" : "rounded-bl-lg",
      );

  const inner = (
    <div className={cn("flex flex-col max-w-[min(78%,340px)] min-w-0", mine && "items-end")}>
      {showLabel && !mine ? (
        <span className="text-[12px] font-semibold text-text-secondary mb-1 px-1">
          {sender?.displayName ?? "Kullanıcı"}
        </span>
      ) : null}
      <div className={bubbleClass}>
        {hasText ? (
          <p
            className={cn(
              "text-[15px] whitespace-pre-wrap break-words leading-relaxed",
              mine ? "text-white" : "text-text-primary",
            )}
          >
            {message.content}
          </p>
        ) : null}
        {message.mediaUrls?.map((url) => (
          <MediaImage
            key={url}
            src={url}
            alt=""
            className={cn(
              "rounded-xl max-h-56 w-full min-h-[100px] object-cover",
              hasText ? "mt-2" : "",
            )}
          />
        ))}
        <div
          className={cn(
            "flex items-center gap-1 mt-1.5",
            mine ? "justify-end text-white/80" : "text-text-secondary",
          )}
        >
          <time className="text-[11px] tabular-nums">
            {formatMessageTime(message.createdAt)}
          </time>
          {mine ? (
            message.isRead ? (
              <CheckCheck className="h-3.5 w-3.5" aria-label="Okundu" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-label="İletildi" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );

  if (mine) {
    return (
      <div
        className={cn(
          "w-full flex justify-end gap-2 px-4",
          grouped ? "py-0.5" : "py-1.5",
        )}
      >
        {inner}
        {showAvatar ? (
          <Avatar
            src={me?.avatarUrl ?? sender?.avatarUrl}
            name={me?.displayName ?? "Sen"}
            size="sm"
            className="h-9 w-9 shrink-0 mb-0.5"
          />
        ) : (
          <span className="w-9 shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full flex justify-start gap-2 px-4",
        grouped ? "py-0.5" : "py-1.5",
      )}
    >
      {showAvatar ? (
        <Avatar
          src={sender?.avatarUrl}
          name={sender?.displayName ?? "?"}
          size="sm"
          className="h-9 w-9 shrink-0 mb-0.5"
        />
      ) : (
        <span className="w-9 shrink-0" />
      )}
      {inner}
    </div>
  );
}
