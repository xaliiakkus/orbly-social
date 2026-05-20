"use client";

import type { PostPublic } from "@orbly/types";
import Link from "next/link";
import type { MouseEvent as ReactMouseEvent } from "react";

import { PollBlock } from "@/components/post/poll-block";
import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { isVideoMediaUrl, resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";

export function RepostEmbed({
  post,
  onRefresh,
}: {
  post: PostPublic;
  onRefresh?: () => void;
}) {
  const firstMedia = post.mediaUrls[0];
  const mediaSrc = firstMedia ? resolveMediaUrl(firstMedia) : null;

  return (
    <div
      className="mt-2 rounded-2xl border border-border overflow-hidden"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/profile/${post.author.username}`}
            onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            className="shrink-0"
          >
            <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="sm" />
          </Link>
          <div className="min-w-0 flex flex-wrap items-center gap-x-1 text-[15px]">
            <Link
              href={`/profile/${post.author.username}`}
              onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
              className="font-bold hover:underline truncate"
            >
              {post.author.displayName}
            </Link>
            <span className="text-text-secondary truncate">@{post.author.username}</span>
            <span className="text-text-secondary">·</span>
            <time className="text-text-secondary shrink-0">
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
        </div>
        {post.content.trim() ? (
          <p className="mt-1 text-[15px] leading-snug text-text-primary whitespace-pre-wrap break-words">
            {post.content}
          </p>
        ) : null}
        {post.poll ? (
          <div className="mt-2">
            <PollBlock postId={post.id} poll={post.poll} onVoted={onRefresh} />
          </div>
        ) : null}
        {mediaSrc ? (
          isVideoMediaUrl(firstMedia!) || isVideoMediaUrl(mediaSrc) ? (
            <video
              src={mediaSrc}
              controls
              playsInline
              preload="metadata"
              className="mt-2 w-full max-h-64 rounded-xl bg-black object-contain"
            />
          ) : (
            <MediaImage
              src={mediaSrc}
              alt=""
              className={cn(
                "mt-2 w-full max-h-64 rounded-xl border border-border object-cover",
              )}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
