"use client";

import {
  canManagePost,
  postRoom,
  useDeletePost,
  usePostBookmark,
  usePostLike,
  usePostView,
  useSocketRooms,
  useUpdatePost,
} from "@orbly/features";
import { formatUserError } from "@orbly/api-client";
import {
  Bookmark,
  BarChart3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Radio,
  Repeat2,
  Share,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent, Ref } from "react";

import { EditPostModal } from "@/components/post/edit-post-modal";
import { useReplyComposeOptional } from "@/components/post/reply-compose-context";
import { PollBlock } from "@/components/post/poll-block";
import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import { getSocket } from "@/lib/socket";
import { formatCount, formatRelativeTime } from "@/lib/format";
import type { PostPublic } from "@orbly/types";

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
  /** Kök dışı bir gönderiye yanıt — X tarzı bağlam satırı */
  replyingToUsername?: string | null;
  highlightReply?: boolean;
}) {
  const router = useRouter();
  const replyCompose = useReplyComposeOptional();
  const accessToken = useAuthStore((s) => s.accessToken);
  const viewer = useAuthStore((s) => s.user);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
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
  const view = usePostView(post.id);

  useEffect(() => {
    view.mutate();
  }, [post.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        "flex gap-3 px-4 py-3 border-b border-border hover:bg-bg-hover/60 transition-colors cursor-pointer",
        isReplyTarget && "bg-accent/5",
      )}
    >
      <Link
        href={`/profile/${post.author.username}`}
        onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
        className="shrink-0 mt-0.5"
      >
        <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="md" />
      </Link>

      <div className="min-w-0 flex-1">
        {post.liveBroadcastId && (
          <Link
            href={`/live/${post.liveBroadcastId}/ozet`}
            onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-like/10 text-like text-sm font-bold hover:bg-like/20"
          >
            <Radio className="h-4 w-4" />
            Yayın özetini gör
          </Link>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap text-[15px] min-w-0">
            <Link
              href={`/profile/${post.author.username}`}
              onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
              className="font-bold hover:underline truncate max-w-[140px] sm:max-w-none"
            >
              {post.author.displayName}
            </Link>
            <span className="text-text-secondary truncate">@{post.author.username}</span>
            <span className="text-text-secondary">·</span>
            <time className="text-text-secondary shrink-0 hover:underline">
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
          <div className="flex items-center shrink-0 gap-0.5">
            {manageable ? (
              <PostOwnerMenu
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onEdit={() => setEditOpen(true)}
                onDelete={() => void handleDelete()}
              />
            ) : null}
            <button
              type="button"
              onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                void toggleBookmark();
              }}
              className={cn(
                "p-1.5 -mr-1 rounded-full text-text-secondary hover:text-accent hover:bg-accent/10",
                bookmarked && "text-accent",
              )}
              aria-label="Yer imi"
            >
              <Bookmark className={cn("h-[18px] w-[18px]", bookmarked && "fill-accent")} />
            </button>
          </div>
        </div>

        {post.orbit && (
          <Link
            href={`/orbits/${post.orbit.slug}`}
            onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-0.5 text-orbit text-[13px] font-semibold hover:underline"
          >
            {post.orbit.name}
          </Link>
        )}

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

        <p className="mt-1 text-[15px] leading-[1.45] whitespace-pre-wrap break-words text-text-primary">
          {post.content}
        </p>

        {post.poll && (
          <div className="mt-3" onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            <PollBlock postId={post.id} poll={post.poll} onVoted={onRefresh} />
          </div>
        )}

        {post.mediaUrls.length > 0 && (
          <div
            className={cn(
              "mt-3 rounded-2xl overflow-hidden border border-border",
              post.mediaUrls.length === 1 && "max-w-[508px]",
            )}
            onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div
              className={cn(
                "grid gap-0.5",
                post.mediaUrls.length >= 2 && "grid-cols-2",
              )}
            >
              {post.mediaUrls.map((url, i) => {
                const isVideo = /\.(mp4|webm|m3u8)(\?|$)/i.test(url);
                if (isVideo) {
                  return (
                    <video
                      key={url}
                      src={url}
                      controls
                      playsInline
                      preload="metadata"
                      className={cn(
                        "w-full bg-black object-contain",
                        post.mediaUrls.length === 1 ? "max-h-[min(512px,70vh)]" : "aspect-video max-h-64",
                      )}
                    />
                  );
                }
                return (
                  <MediaImage
                    key={url}
                    src={url}
                    alt=""
                    className={cn(
                      "w-full object-cover bg-bg-secondary",
                      post.mediaUrls.length === 1 ? "max-h-[min(512px,70vh)]" : "aspect-video max-h-64",
                      post.mediaUrls.length === 3 && i === 0 && "row-span-2 h-full min-h-[200px]",
                    )}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div
          className="flex items-center justify-between max-w-[425px] mt-3 -ml-2 text-text-secondary"
          onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <ActionBtn
            icon={MessageCircle}
            count={post.stats.replyCount}
            label="Yanıtla"
            hover="reply"
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
          />
          <ActionBtn icon={Repeat2} count={post.stats.repostCount} label="Repost" hover="repost" />
          <button
            type="button"
            onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
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
          <ActionBtn icon={Share} label="Paylaş" />
        </div>

        {post.stats.viewCount > 0 && (
          <p className="mt-1 text-[13px] text-text-secondary flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            {formatCount(post.stats.viewCount)} görüntülenme
          </p>
        )}
      </div>
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
    <div ref={menuRef as Ref<HTMLDivElement>} className="relative">
      <button
        type="button"
        onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
        className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-hover"
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

function ActionBtn({
  icon: Icon,
  count,
  label,
  hover,
  onClick,
}: {
  icon: typeof Heart;
  count?: number;
  label: string;
  hover?: "reply" | "repost";
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  const hoverClass =
    hover === "reply"
      ? "hover:text-reply hover:bg-reply/10"
      : hover === "repost"
        ? "hover:text-repost hover:bg-repost/10"
        : "hover:text-accent hover:bg-accent/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 p-2 rounded-full transition-colors",
        hoverClass,
      )}
      aria-label={label}
    >
      <Icon className="h-[18px] w-[18px]" />
      {count !== undefined && count > 0 && (
        <span className="text-[13px]">{formatCount(count)}</span>
      )}
    </button>
  );
}
