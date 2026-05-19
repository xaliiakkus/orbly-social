"use client";

import type { PostPublic } from "@orbly/types";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LegacyRef } from "react";
import { createPortal } from "react-dom";

import { MobileFullComposeDrawer } from "@/components/layout/mobile-full-compose-drawer";
import {
  ComposeBox,
  type ComposeBoxHandle,
  type ComposeBoxState,
} from "@/components/post/compose-box";
import { useReplyCompose } from "@/components/post/reply-compose-context";
import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { useMdUp } from "@/lib/use-md-up";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

function ReplyTargetPreview({ post }: { post: PostPublic }) {
  const firstMedia = post.mediaUrls[0];

  return (
    <div className="flex gap-3 min-w-0">
      <div className="flex flex-col items-center shrink-0 w-10">
        <Avatar src={post.author.avatarUrl} name={post.author.displayName} size="md" />
        <div className="w-0.5 flex-1 min-h-[12px] my-1 rounded-full bg-border" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[15px]">
          <span className="font-bold truncate max-w-[140px]">{post.author.displayName}</span>
          <span className="text-text-secondary truncate">@{post.author.username}</span>
          <span className="text-text-secondary">·</span>
          <time className="text-text-secondary shrink-0">
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>
        {post.content.trim() ? (
          <p className="mt-1 text-[15px] leading-snug text-text-primary whitespace-pre-wrap break-words">
            {post.content}
          </p>
        ) : null}
        {firstMedia ? (
          <MediaImage
            src={firstMedia}
            alt=""
            className="mt-2 max-h-32 w-auto max-w-full rounded-2xl border border-border object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}

function ReplyComposeFields({
  targetPost,
  onPosted,
  submitInHeader,
  composeRef,
  onComposeState,
}: {
  targetPost: PostPublic;
  onPosted: () => void;
  submitInHeader: boolean;
  composeRef: React.RefObject<ComposeBoxHandle | null>;
  onComposeState: (s: ComposeBoxState) => void;
}) {
  const replyContext = (
    <>
      <ReplyTargetPreview post={targetPost} />
      <p className="text-[13px] text-accent mt-2 pl-[52px]">
        <span className="font-bold">@{targetPost.author.username}</span> adlı kişiye yanıt olarak
      </p>
    </>
  );

  return (
    <ComposeBox
      ref={composeRef as LegacyRef<ComposeBoxHandle>}
      variant="reply-modal"
      submitInHeader={submitInHeader}
      replyToId={targetPost.id}
      replyToUsername={targetPost.author.username}
      onPosted={onPosted}
      onComposeState={onComposeState}
      focusSession={targetPost.id}
      replyContext={replyContext}
      className="flex flex-1 min-h-0 flex-col border-0 hover:bg-transparent"
    />
  );
}

export function ReplyComposeModal({ onPosted }: { onPosted?: () => void }) {
  const { targetPost, closeReply } = useReplyCompose();
  const mdUp = useMdUp();
  const [mounted, setMounted] = useState(false);
  const composeRef = useRef<ComposeBoxHandle>(null);
  const [composeState, setComposeState] = useState<ComposeBoxState>({
    canPost: false,
    isPending: false,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!targetPost) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [targetPost]);

  const handlePosted = useCallback(() => {
    onPosted?.();
    closeReply();
  }, [onPosted, closeReply]);

  const onComposeState = useCallback((s: ComposeBoxState) => {
    setComposeState(s);
  }, []);

  if (!mounted || !targetPost) return null;

  const submit = () => composeRef.current?.submit();

  if (!mdUp) {
    return (
      <MobileFullComposeDrawer
        open
        onClose={closeReply}
        onSubmit={submit}
        canSubmit={composeState.canPost}
        isSubmitting={composeState.isPending}
        submitLabel="Yanıtla"
      >
        <ReplyComposeFields
          targetPost={targetPost}
          onPosted={handlePosted}
          submitInHeader
          composeRef={composeRef}
          onComposeState={onComposeState}
        />
      </MobileFullComposeDrawer>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[8vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reply-compose-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65"
        aria-label="Kapat"
        onClick={closeReply}
      />
      <div
        className={cn(
          "relative z-10 flex w-full max-w-[600px] flex-col",
          "max-h-[min(92dvh,720px)] overflow-hidden",
          "rounded-2xl border border-border bg-bg-primary shadow-2xl",
        )}
      >
        <header className="flex items-center justify-between px-3 py-2 shrink-0">
          <button
            type="button"
            onClick={closeReply}
            className="p-2 rounded-full hover:bg-bg-hover"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
          <span id="reply-compose-title" className="sr-only">
            Yanıt yaz
          </span>
          <span
            className="text-[15px] text-text-secondary/50 cursor-not-allowed select-none"
            title="Yakında"
          >
            Taslaklar
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-4">
          <ReplyComposeFields
            targetPost={targetPost}
            onPosted={handlePosted}
            submitInHeader={false}
            composeRef={composeRef}
            onComposeState={onComposeState}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
