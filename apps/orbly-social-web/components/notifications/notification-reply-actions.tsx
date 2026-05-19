"use client";

import { notificationReplyTarget, usePostLike } from "@orbly/features";
import type { NotificationItem } from "@orbly/types";
import { BarChart3, Heart, MessageCircle, Repeat2, Share } from "lucide-react";

import { useReplyComposeOptional } from "@/components/post/reply-compose-context";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/cn";

export function NotificationReplyActions({ item }: { item: NotificationItem }) {
  const preview = item.postPreview;
  const replyCompose = useReplyComposeOptional();
  const target = notificationReplyTarget(item);
  const postId = preview?.id ?? "";
  const stats = preview?.stats;

  const { liked, count: likeCount, toggle: toggleLike } = usePostLike(
    postId,
    preview?.likedByMe ?? false,
    stats?.likeCount ?? 0,
  );

  if (!preview || !target) return null;

  return (
    <div
      className="flex items-center justify-between max-w-[425px] mt-3 -ml-2 text-text-secondary"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="group flex items-center gap-1 p-2 rounded-full hover:text-reply hover:bg-reply/10 transition-colors"
        aria-label="Yanıtla"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          replyCompose?.openReply(target);
        }}
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        {(stats?.replyCount ?? 0) > 0 && (
          <span className="text-[13px]">{formatCount(stats!.replyCount)}</span>
        )}
      </button>
      <button
        type="button"
        className="group flex items-center gap-1 p-2 rounded-full hover:text-repost hover:bg-repost/10 transition-colors"
        aria-label="Yeniden paylaş"
        onClick={(e) => e.preventDefault()}
      >
        <Repeat2 className="h-[18px] w-[18px]" />
        {(stats?.repostCount ?? 0) > 0 && (
          <span className="text-[13px]">{formatCount(stats!.repostCount)}</span>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggleLike();
        }}
        className={cn(
          "group flex items-center gap-1 p-2 rounded-full transition-colors",
          liked ? "text-like" : "hover:text-like hover:bg-like/10",
        )}
        aria-label="Beğen"
      >
        <Heart className={cn("h-[18px] w-[18px]", liked && "fill-like")} />
        {likeCount > 0 && <span className="text-[13px]">{formatCount(likeCount)}</span>}
      </button>
      <button
        type="button"
        className="group flex items-center gap-1 p-2 rounded-full hover:bg-bg-hover transition-colors"
        aria-label="Paylaş"
        onClick={(e) => e.preventDefault()}
      >
        <Share className="h-[18px] w-[18px]" />
      </button>
      {(stats?.viewCount ?? 0) > 0 ? (
        <span className="flex items-center gap-1 p-2 text-[13px]">
          <BarChart3 className="h-3.5 w-3.5" />
          {formatCount(stats!.viewCount)}
        </span>
      ) : null}
    </div>
  );
}
