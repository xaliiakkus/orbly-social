"use client";

import {
  isMessageMine,
  resolveMessageSender,
} from "@orbly/features";
import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { formatRelativeTime } from "@/lib/format";
import type { MessageItem, UserPublic } from "@orbly/types";

export function ChatMessage({
  message,
  me,
  other,
}: {
  message: MessageItem;
  me: UserPublic | null | undefined;
  other: UserPublic | null | undefined;
}) {
  const mine = isMessageMine(message.senderId, me?.id);
  const sender = resolveMessageSender(message, me, other);
  const label = mine ? "Sen" : sender?.displayName ?? "Kullanıcı";

  if (mine) {
    return (
      <div className="w-full flex justify-end gap-2 px-4 py-2">
        <div className="flex flex-col items-end max-w-[min(80%,320px)] min-w-0">
          <span className="text-[12px] font-semibold text-text-secondary mb-1 px-1">
            {label}
          </span>
          <div className="rounded-2xl rounded-br-md bg-accent text-white px-4 py-2.5 shadow-sm">
            {message.content ? (
              <p className="text-[15px] whitespace-pre-wrap break-words">{message.content}</p>
            ) : null}
            {message.mediaUrls?.map((url) => (
              <MediaImage
                key={url}
                src={url}
                alt=""
                className="mt-2 rounded-xl max-h-48 w-full min-h-[80px]"
              />
            ))}
            <time className="text-[11px] text-white/75 block mt-1 text-right">
              {formatRelativeTime(message.createdAt)}
            </time>
          </div>
        </div>
        <Avatar
          src={me?.avatarUrl ?? sender?.avatarUrl}
          name={me?.displayName ?? "Sen"}
          size="sm"
          className="h-10 w-10 shrink-0"
        />
      </div>
    );
  }

  return (
    <div className="w-full flex justify-start gap-2 px-4 py-2">
      <Avatar
        src={sender?.avatarUrl}
        name={sender?.displayName ?? "?"}
        size="sm"
        className="h-10 w-10 shrink-0"
      />
      <div className="flex flex-col items-start max-w-[min(80%,320px)] min-w-0">
        <span className="text-[12px] font-semibold text-text-secondary mb-1 px-1">
          {label}
        </span>
        <div className="rounded-2xl rounded-bl-md bg-bg-secondary border border-border/60 px-4 py-2.5">
          {message.content ? (
            <p className="text-[15px] text-text-primary whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : null}
          {message.mediaUrls?.map((url) => (
            <MediaImage
              key={url}
              src={url}
              alt=""
              className="mt-2 rounded-xl max-h-48 w-full min-h-[80px]"
            />
          ))}
          <time className="text-[11px] text-text-secondary block mt-1">
            {formatRelativeTime(message.createdAt)}
          </time>
        </div>
      </div>
    </div>
  );
}
