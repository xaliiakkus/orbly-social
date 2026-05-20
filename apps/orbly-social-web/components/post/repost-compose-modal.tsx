"use client";

import { getRepostTargetPost } from "@orbly/features";
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
import { RepostEmbed } from "@/components/post/repost-embed";
import { useRepostCompose } from "@/components/post/repost-compose-context";
import { useMdUp } from "@/lib/use-md-up";
import { cn } from "@/lib/cn";

export function RepostComposeModal({ onPosted }: { onPosted?: () => void }) {
  const { quoteTarget, closeQuote } = useRepostCompose();
  const mdUp = useMdUp();
  const [mounted, setMounted] = useState(false);
  const composeRef = useRef<ComposeBoxHandle>(null);
  const [composeState, setComposeState] = useState<ComposeBoxState>({
    canPost: false,
    isPending: false,
  });
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  const handlePosted = useCallback(() => {
    onPosted?.();
    closeQuote();
    setError("");
  }, [closeQuote, onPosted]);

  const submit = () => composeRef.current?.submit();

  if (!quoteTarget || !mounted) return null;

  const target = getRepostTargetPost(quoteTarget);
  const quoteContext = (
    <>
      <RepostEmbed post={target} />
      <p className="text-[13px] text-text-secondary mt-2">
        Alıntı olarak paylaş
      </p>
    </>
  );

  const fields = (
    <ComposeBox
      ref={composeRef as LegacyRef<ComposeBoxHandle>}
      variant="reply-modal"
      submitInHeader
      quoteRepostId={target.id}
      submitLabel="Alıntıla"
      onPosted={handlePosted}
      onComposeState={setComposeState}
      focusSession={target.id}
      replyContext={quoteContext}
      className="flex flex-1 min-h-0 flex-col border-0 hover:bg-transparent"
      onQuoteError={setError}
    />
  );

  const header = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <button
        type="button"
        onClick={closeQuote}
        className="p-2 -ml-2 rounded-full hover:bg-bg-hover text-text-primary"
        aria-label="Kapat"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        type="button"
        disabled={!composeState.canPost || composeState.isPending}
        onClick={submit}
        className={cn(
          "rounded-full bg-accent px-4 py-1.5 text-[15px] font-bold text-white",
          (!composeState.canPost || composeState.isPending) && "opacity-50",
        )}
      >
        Alıntıla
      </button>
    </div>
  );

  const body = (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {header}
      {error ? (
        <p className="px-4 py-2 text-sm text-like" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">{fields}</div>
    </div>
  );

  if (mdUp) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[10vh]"
        onClick={closeQuote}
        role="presentation"
      >
        <div
          className="w-full max-w-[600px] max-h-[85vh] flex flex-col rounded-2xl bg-bg-primary border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal
        >
          {body}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <MobileFullComposeDrawer
      open
      onClose={closeQuote}
      onSubmit={submit}
      canSubmit={composeState.canPost}
      isSubmitting={composeState.isPending}
      submitLabel="Alıntıla"
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4">
        {error ? (
          <p className="py-2 text-sm text-like" role="alert">
            {error}
          </p>
        ) : null}
        {quoteContext}
        {fields}
      </div>
    </MobileFullComposeDrawer>
  );
}
