"use client";

import {
  canManagePost,
  getRepostDisplayCount,
  getRepostTargetId,
  getPostShareUrl,
  getRepostTargetPost,
  postRoom,
  useDeletePost,
  usePostBookmark,
  usePostLike,
  usePostRepost,
  usePostView,
  useSocketRooms,
  useUpdatePost,
} from "@orbly/features";
import { formatUserError } from "@orbly/api-client";
import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Radio,
  Repeat2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent, Ref } from "react";

import { EditPostModal } from "@/components/post/edit-post-modal";
import { useReplyComposeOptional } from "@/components/post/reply-compose-context";
import { useRepostComposeOptional } from "@/components/post/repost-compose-context";
import { RepostEmbed } from "@/components/post/repost-embed";
import { RepostMenu } from "@/components/post/repost-menu";
import { RepostersModal } from "@/components/post/reposters-modal";
import { PollBlock } from "@/components/post/poll-block";
import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { isVideoMediaUrl, resolveMediaUrl } from "@/lib/media-url";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import { getSocket } from "@/lib/socket";
import { formatCount, formatRelativeTime } from "@/lib/format";
import type { PostPublic } from "@orbly/types";

function renderPostContent(content: string) {
  const parts = content.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part.startsWith("#") && part.length > 1) {
      const tag = part.slice(1).replace(/[^a-zA-Z0-9_\u00C0-\u024F]/g, "");
      if (!tag) return <span key={`t-${i}`}>{part}</span>;
      return (
        <Link
          key={`h-${i}`}
          href={`/explore?tag=${encodeURIComponent(tag)}`}
          onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
          className="text-accent hover:underline"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("@") && part.length > 1) {
      const user = part.slice(1).replace(/[^\w]/g, "");
      if (!user) return <span key={`t-${i}`}>{part}</span>;
      return (
        <Link
          key={`m-${i}`}
          href={`/profile/${user}`}
          onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
          className="text-accent hover:underline"
        >
          {part}
        </Link>
      );
    }
    return <span key={`c-${i}`}>{part}</span>;
  });
}

export function PostCard({
  post,
  onRefresh,
  onDeleted,
  onReply,
  threadRootId: threadRootIdProp,
  replyingToUsername,
  highlightReply,
}: {
  post: PostPublic;
  onRefresh?: () => void;
  onDeleted?: () => void;
  onReply?: () => void;
  threadRootId?: string;
  replyingToUsername?: string | null;
  highlightReply?: boolean;
}) {
  const router = useRouter();
  const replyCompose = useReplyComposeOptional();
  const repostCompose = useRepostComposeOptional();
  const accessToken = useAuthStore((s) => s.accessToken);
  const viewer = useAuthStore((s) => s.user);
  const repostTarget = getRepostTargetPost(post);
  const repostTargetId = getRepostTargetId(post);
  const isRepostCard = !!post.repostOf;
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [repostersOpen, setRepostersOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const manageable = canManagePost(post, viewer?.id);
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  useSocketRooms(
    () => getSocket(accessToken),
    [postRoom(post.id)],
  );
  const { liked, count: likeCount, toggle: toggleLike } = usePostLike(
    post.id,
    post.likedByMe ?? false,
    post.stats.likeCount,
  );
  const { bookmarked, toggle: toggleBookmark } = usePostBookmark(
    post.id,
    post.bookmarkedByMe ?? false,
  );
  const {
    reposted,
    count: repostCount,
    toggle: toggleRepost,
    isPending: repostPending,
  } = usePostRepost(
    repostTargetId,
    post.repostedByMe ?? false,
    getRepostDisplayCount(post),
    post.myRepostId,
  );
  const ownPost = viewer?.id === repostTarget.author.id;
  const { recordView } = usePostView(
    repostTargetId,
    viewer?.id,
    repostTarget.author.id,
  );

  const copyPostLink = async () => {
    const url = getPostShareUrl(
      repostTargetId,
      typeof window !== "undefined" ? window.location.origin : undefined,
    );
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt("Bağlantı", url);
    }
  };

  useEffect(() => {
    recordView();
  }, [repostTargetId, recordView]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const handleDelete = async () => {
    if (!window.confirm("Bu gönderiyi silmek istediğine emin misin?")) return;
    setMenuOpen(false);
    try {
      await deletePost.mutateAsync(post.id);
      onDeleted?.();
    } catch (e) {
      window.alert(formatUserError(e));
    }
  };

  const handleSaveEdit = async (content: string) => {
    setEditError("");
    try {
      await updatePost.mutateAsync({
        postId: post.id,
        content,
        mediaUrls: post.mediaUrls,
      });
      setEditOpen(false);
      onRefresh?.();
    } catch (e) {
      setEditError(formatUserError(e));
    }
  };

  const threadRootId = threadRootIdProp ?? post.replyToId ?? post.id;
  const openThread = () => router.push(`/post/${threadRootId}`);
  const isReplyTarget = highlightReply || replyCompose?.targetPost?.id === post.id;

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openThread}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => e.key === "Enter" && openThread()}
      className={cn(
        "post-card-hover px-4 py-3 cursor-pointer",
        isReplyTarget && "bg-accent/[0.06]",
      )}
    >
      <div className="flex gap-3">
        <Link
          href={`/profile/${post.author.username}`}
          onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
          className="shrink-0"
        >
          <Avatar
            src={post.author.avatarUrl}
            name={post.author.displayName}
            size="md"
            className="hover:opacity-90 transition-opacity"
          />
        </Link>

        <div className="min-w-0 flex-1">
          {isRepostCard ? (
            <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary">
              <Repeat2 className="h-3.5 w-3.5 text-repost shrink-0" />
              {post.author.displayName} yeniden paylaştı
            </p>
          ) : null}

          {post.liveBroadcastId ? (
            <Link
              href={`/live/${post.liveBroadcastId}/ozet`}
              onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
              className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-like/10 text-like text-[13px] font-bold hover:bg-like/20"
            >
              <Radio className="h-4 w-4" />
              Yayın özetini gör
            </Link>
          ) : null}

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap min-w-0 text-[15px]">
              <Link
                href={`/profile/${post.author.username}`}
                onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                className="font-bold text-text-primary hover:underline truncate max-w-[160px] sm:max-w-none"
              >
                {post.author.displayName}
              </Link>
              {post.author.verified ? (
                <BadgeCheck className="h-4 w-4 text-accent shrink-0" aria-label="Doğrulanmış" />
              ) : null}
              <span className="text-text-secondary truncate">@{post.author.username}</span>
              <span className="text-text-secondary">·</span>
              <time className="text-text-secondary shrink-0 hover:underline">
                {formatRelativeTime(post.createdAt)}
              </time>
            </div>

            {manageable ? (
              <PostOwnerMenu
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onEdit={() => setEditOpen(true)}
                onDelete={() => void handleDelete()}
              />
            ) : (
              <button
                type="button"
                className="p-1.5 -mt-0.5 rounded-full text-text-secondary hover:bg-accent/10 hover:text-accent transition-colors shrink-0"
                onClick={(e: ReactMouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                aria-label="Menü"
              >
                <MoreHorizontal className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>

          {post.orbit ? (
            <div className="flex items-center gap-1.5 mb-1 mt-0.5">
              <span className="text-[13px] text-text-secondary">in</span>
              <Link
                href={`/orbits/${post.orbit.slug}`}
                onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                className="orbit-pill hover:opacity-90"
              >
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>{post.orbit.name}</span>
              </Link>
            </div>
          ) : null}

          {replyingToUsername ? (
            <p className="mt-0.5 text-[13px] text-text-secondary">
              Yanıtlanıyor{" "}
              <Link
                href={`/profile/${replyingToUsername}`}
                onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                className="text-accent hover:underline"
              >
                @{replyingToUsername}
              </Link>
            </p>
          ) : null}

          {post.content.trim() ? (
            <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-line break-words text-text-primary">
              {renderPostContent(post.content)}
            </p>
          ) : null}

          {post.repostOf ? (
            <div className="mt-3" onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}>
              <RepostEmbed post={post.repostOf} onRefresh={onRefresh} />
            </div>
          ) : null}

          {!post.repostOf && post.poll ? (
            <div className="mt-3" onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}>
              <PollBlock postId={post.id} poll={post.poll} onVoted={onRefresh} />
            </div>
          ) : null}

          {!post.repostOf && post.mediaUrls.length > 0 ? (
            <div
              className={cn(
                "mt-3 rounded-2xl overflow-hidden border border-border",
                post.mediaUrls.length === 1 && "max-w-[508px]",
              )}
              onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className={cn("grid gap-0.5", post.mediaUrls.length >= 2 && "grid-cols-2")}>
                {post.mediaUrls.map((url, i) => {
                  const mediaSrc = resolveMediaUrl(url);
                  if (!mediaSrc) return null;
                  if (isVideoMediaUrl(url) || isVideoMediaUrl(mediaSrc)) {
                    return (
                      <video
                        key={url}
                        src={mediaSrc}
                        controls
                        playsInline
                        preload="metadata"
                        className={cn(
                          "w-full bg-black object-contain",
                          post.mediaUrls.length === 1
                            ? "max-h-[min(512px,70vh)]"
                            : "aspect-video max-h-64",
                        )}
                      />
                    );
                  }
                  return (
                    <MediaImage
                      key={url}
                      src={mediaSrc}
                      alt=""
                      sizes={
                        post.mediaUrls.length === 1
                          ? "(max-width: 768px) 100vw, 508px"
                          : "(max-width: 768px) 50vw, 254px"
                      }
                      className={cn(
                        "w-full h-auto bg-bg-secondary",
                        post.mediaUrls.length === 1
                          ? "max-h-[min(512px,70vh)]"
                          : "aspect-video max-h-64 w-full",
                        post.mediaUrls.length === 3 && i === 0 && "row-span-2 min-h-[200px]",
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          <div
            className="flex items-center justify-between mt-3 -ml-2 max-w-md"
            onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <button
              type="button"
              className="post-action-group flex items-center gap-1.5 p-2 rounded-full text-text-secondary hover:text-reply transition-all"
              aria-label="Yanıtla"
              onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                if (onReply) {
                  onReply();
                } else if (replyCompose) {
                  replyCompose.openReply(post);
                } else {
                  router.push(`/post/${threadRootId}?replyTo=${post.id}`);
                }
              }}
            >
              <span className="post-action-bg rounded-full p-1 -m-1 transition-colors">
                <MessageCircle className="h-[18px] w-[18px]" />
              </span>
              {post.stats.replyCount > 0 ? (
                <span className="text-[13px] tabular-nums">{formatCount(post.stats.replyCount)}</span>
              ) : null}
            </button>

            <div className="flex items-center gap-0">
              <RepostMenu
                reposted={reposted}
                disabled={repostPending || ownPost}
                onRepost={() => void toggleRepost()}
                onUnrepost={() => void toggleRepost()}
                onQuote={() => repostCompose?.openQuote(post)}
                onCopyLink={() => void copyPostLink()}
              />
              {repostCount > 0 ? (
                <button
                  type="button"
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRepostersOpen(true);
                  }}
                  className={cn(
                    "text-[13px] tabular-nums -ml-1 p-1 rounded hover:underline",
                    reposted ? "text-repost" : "text-text-secondary",
                  )}
                >
                  {formatCount(repostCount)}
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleLike();
              }}
              className={cn(
                "like-action-group flex items-center gap-1.5 p-2 rounded-full transition-all",
                liked ? "text-like like-active" : "text-text-secondary hover:text-like",
              )}
              aria-label="Beğen"
            >
              <span className="like-action-bg rounded-full p-1 -m-1 transition-colors">
                <Heart className={cn("h-[18px] w-[18px]", liked && "fill-current")} />
              </span>
              {likeCount > 0 ? (
                <span className="text-[13px] tabular-nums">{formatCount(likeCount)}</span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleBookmark();
              }}
              className={cn(
                "flex items-center gap-1.5 p-2 rounded-full transition-all hover:bg-accent/10",
                bookmarked
                  ? "text-accent bookmark-active"
                  : "text-text-secondary hover:text-accent",
              )}
              aria-label="Yer imi"
            >
              <Bookmark className={cn("h-[18px] w-[18px]", bookmarked && "fill-current")} />
            </button>

            {repostTarget.stats.viewCount > 0 ? (
              <div className="flex items-center gap-1.5 p-2 text-text-secondary pointer-events-none">
                <BarChart3 className="h-[18px] w-[18px]" />
                <span className="text-[13px] tabular-nums">
                  {formatCount(repostTarget.stats.viewCount)}
                </span>
              </div>
            ) : null}

            {linkCopied ? (
              <span className="sr-only" aria-live="polite">
                Bağlantı kopyalandı
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <RepostersModal
        postId={repostTargetId}
        open={repostersOpen}
        onClose={() => setRepostersOpen(false)}
      />
      <EditPostModal
        post={post}
        open={editOpen}
        saving={updatePost.isPending}
        error={editError}
        onClose={() => {
          setEditOpen(false);
          setEditError("");
        }}
        onSave={(content) => void handleSaveEdit(content)}
      />
    </article>
  );
}

function PostOwnerMenu({
  menuRef,
  menuOpen,
  setMenuOpen,
  onEdit,
  onDelete,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div ref={menuRef as Ref<HTMLDivElement>} className="relative shrink-0 -mt-0.5">
      <button
        type="button"
        onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
        className="p-1.5 rounded-full text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
        aria-label="Gönderi menüsü"
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </button>
      {menuOpen ? (
        <div
          className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-xl border border-border bg-bg-primary shadow-lg overflow-hidden"
          onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-[15px] hover:bg-bg-hover"
            onClick={() => {
              setMenuOpen(false);
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4" />
            Düzenle
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-[15px] text-like hover:bg-bg-hover"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Sil
          </button>
        </div>
      ) : null}
    </div>
  );
}
