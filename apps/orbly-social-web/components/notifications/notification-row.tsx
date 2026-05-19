"use client";

import {
  getEntryHref,
  getGroupedHeadline,
  getNotificationHeadline,
  getNotificationIconKind,
  getReplyingToLabel,
  isFollowStyleNotification,
  isReplyStyleNotification,
  notificationShowsMediaThumb,
  type NotificationFeedEntry,
} from "@orbly/features";
import type { NotificationItem } from "@orbly/types";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { NotificationAvatarStack } from "@/components/notifications/notification-avatar-stack";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { NotificationReplyActions } from "@/components/notifications/notification-reply-actions";
import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export function NotificationRow({
  entry,
  onOpen,
}: {
  entry: NotificationFeedEntry;
  onOpen?: (entry: NotificationFeedEntry) => void;
}) {
  if (entry.kind === "group") {
    return <GroupRow entry={entry} onOpen={onOpen} />;
  }
  return <SingleRow item={entry.item} onOpen={() => onOpen?.(entry)} />;
}

function SingleRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen?: () => void;
}) {
  const href = getEntryHref({ kind: "single", item });
  const iconKind = getNotificationIconKind(item.type);
  const replyStyle = isReplyStyleNotification(item);
  const followStyle = isFollowStyleNotification(item);
  const showThumb = notificationShowsMediaThumb(item);
  const replyTo = item.postPreview ? getReplyingToLabel(item.postPreview) : null;

  if (replyStyle && item.actor && item.postPreview) {
    return (
      <div className={cn("border-b border-border", !item.isRead && "bg-accent/[0.06]")}>
        <div className="flex gap-3 px-4 py-3">
          {!item.isRead ? <UnreadDot /> : <span className="w-[6px] shrink-0" />}
          <Link href={href ?? "#"} onClick={onOpen} className="flex gap-3 min-w-0 flex-1">
            <Avatar src={item.actor.avatarUrl} name={item.actor.displayName} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug">
                    <span className="font-bold">{item.actor.displayName}</span>
                    {item.actor.verified ? <VerifiedBadge /> : null}
                    <span className="text-text-secondary font-normal">
                      {" "}
                      @{item.actor.username}
                    </span>
                    <span className="text-text-secondary font-normal">
                      {" · "}
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </p>
                  {replyTo ? (
                    <p className="text-text-secondary text-[15px] mt-0.5">
                      Yanıtlanıyor <span className="text-accent">@{replyTo}</span>
                    </p>
                  ) : null}
                  <p className="text-[15px] mt-1 whitespace-pre-wrap break-words">
                    {item.postPreview.content}
                  </p>
                  {item.postPreview.mediaUrl ? (
                    <MediaImage
                      src={item.postPreview.mediaUrl}
                      alt=""
                      className="mt-2 max-h-40 rounded-2xl border border-border object-cover w-full max-w-sm"
                    />
                  ) : null}
                </div>
                <button
                  type="button"
                  className="p-1 rounded-full text-text-secondary hover:bg-bg-hover shrink-0"
                  aria-label="Daha fazla"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </Link>
        </div>
        <div className="pl-[52px] pr-4 pb-3">
          <NotificationReplyActions item={item} />
        </div>
      </div>
    );
  }

  return (
    <NotificationLink href={href} unread={!item.isRead} onNavigate={onOpen}>
      <div className="flex gap-2 px-4 py-4">
        {!item.isRead ? <UnreadDot /> : <span className="w-[6px] shrink-0" />}
        <div className="w-[26px] shrink-0 flex justify-center pt-0.5">
          <NotificationIcon kind={iconKind} />
        </div>
        <div className="min-w-0 flex-1 flex gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {item.actor ? (
                <Avatar
                  src={item.actor.avatarUrl}
                  name={item.actor.displayName}
                  size={followStyle ? "md" : "sm"}
                />
              ) : null}
              <p className="text-[15px] leading-snug min-w-0 pt-0.5">
                <span className="font-bold">{getNotificationHeadline(item)}</span>
                {item.actor?.verified ? <VerifiedBadge /> : null}
                <span className="text-text-secondary"> · {formatRelativeTime(item.createdAt)}</span>
              </p>
            </div>
            {item.postPreview?.content && !replyStyle ? (
              <p className="text-text-secondary text-[15px] mt-2 line-clamp-2">
                {item.postPreview.content}
              </p>
            ) : null}
          </div>
          {showThumb && item.postPreview?.mediaUrl ? (
            <MediaImage
              src={item.postPreview.mediaUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border"
            />
          ) : null}
        </div>
      </div>
    </NotificationLink>
  );
}

function GroupRow({
  entry,
  onOpen,
}: {
  entry: Extract<NotificationFeedEntry, { kind: "group" }>;
  onOpen?: (entry: NotificationFeedEntry) => void;
}) {
  const g = entry.group;
  const href = getEntryHref(entry);
  const iconKind = getNotificationIconKind(g.type);
  const showThumb =
    !!g.postPreview?.mediaUrl &&
    (g.type === "like" || g.type === "repost" || g.type === "mention");

  return (
    <NotificationLink href={href} unread={!g.isRead} onNavigate={() => onOpen?.(entry)}>
      <div className="flex gap-2 px-4 py-4">
        {!g.isRead ? <UnreadDot /> : <span className="w-[6px] shrink-0" />}
        <div className="w-[26px] shrink-0 flex justify-center pt-0.5">
          <NotificationIcon kind={iconKind} />
        </div>
        <div className="min-w-0 flex-1 flex gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <NotificationAvatarStack actors={g.actors} />
              <p className="text-[15px] leading-snug min-w-0 pt-0.5 flex-1">
                <span className="font-bold">{getGroupedHeadline(g)}</span>
                <span className="text-text-secondary"> · {formatRelativeTime(g.createdAt)}</span>
              </p>
            </div>
            {g.postPreview?.content ? (
              <p className="text-text-secondary text-[15px] mt-2 line-clamp-2">
                {g.postPreview.content}
              </p>
            ) : null}
          </div>
          {showThumb && g.postPreview?.mediaUrl ? (
            <MediaImage
              src={g.postPreview.mediaUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border"
            />
          ) : null}
        </div>
      </div>
    </NotificationLink>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex align-middle ml-0.5 text-accent" aria-label="Doğrulanmış">
      ✓
    </span>
  );
}

function UnreadDot() {
  return <span className="w-[6px] h-[6px] rounded-full bg-accent shrink-0 mt-2" aria-hidden />;
}

function NotificationLink({
  href,
  unread,
  onNavigate,
  children,
}: {
  href: string | null;
  unread: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const body = (
    <div
      className={cn(
        "border-b border-border hover:bg-bg-hover transition-colors",
        unread && "bg-accent/[0.06]",
      )}
      onClick={onNavigate}
    >
      {children}
    </div>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block">
      {body}
    </Link>
  );
}
