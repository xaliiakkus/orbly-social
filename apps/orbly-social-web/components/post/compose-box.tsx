"use client";

import {
  MAX_MEDIA_PER_POST,
  MIN_POLL_OPTIONS,
  POST_MAX_LENGTH,
  useComposePost,
  useLiveList,
  useQuoteRepost,
} from "@orbly/features";
import { formatUserError } from "@orbly/api-client";
import { BarChart2, ImageIcon, Smile, Users, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { StartSpaceModal } from "@/components/live/start-space-modal";

import { ComposeKeyboardToolbar } from "@/components/post/compose-keyboard-toolbar";
import { GifPicker } from "@/components/post/gif-picker";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { focusTextarea } from "@/lib/focus-textarea";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";

export type ComposeBoxHandle = {
  submit: () => void;
};

export type ComposeBoxState = {
  canPost: boolean;
  isPending: boolean;
};

type Props = {
  className?: string;
  variant?: "default" | "reply-modal" | "mobile-drawer";
  hideAvatar?: boolean;
  submitInHeader?: boolean;
  replyToId?: string;
  replyToUsername?: string;
  quoteRepostId?: string;
  submitLabel?: string;
  onClearReply?: () => void;
  onPosted?: () => void;
  onQuoteError?: (message: string) => void;
  onComposeState?: (state: ComposeBoxState) => void;
  focusSession?: number | string;
  /** Yanıt modalı: üstte gösterilen gönderi özeti (X thread) */
  replyContext?: React.ReactNode;
};

export const ComposeBox = forwardRef<ComposeBoxHandle, Props>(function ComposeBox(
  {
    className,
    variant = "default",
    hideAvatar = false,
    submitInHeader = false,
    replyToId,
    replyToUsername,
    quoteRepostId,
    submitLabel: submitLabelProp,
    onClearReply,
    onPosted,
    onQuoteError,
    onComposeState,
    focusSession = 0,
    replyContext,
  },
  ref,
) {
  const isReplyModal = variant === "reply-modal";
  const isMobileDrawer = variant === "mobile-drawer";
  const isDrawerVariant = isReplyModal || isMobileDrawer;
  const pinToolbar = submitInHeader;

  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [gifUrls, setGifUrls] = useState<string[]>([]);
  const [gifOpen, setGifOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[] | null>(null);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: liveData } = useLiveList();
  const liveAvailable = liveData?.configured === true;
  const compose = useComposePost();
  const quoteRepost = useQuoteRepost();
  const qc = useQueryClient();
  const isQuote = !!quoteRepostId;

  const remaining = POST_MAX_LENGTH - content.length;
  const submitLabel =
    submitLabelProp ??
    (isQuote ? "Alıntıla" : isReplyModal ? "Yanıtla" : "Gönderi yayınla");
  const totalMedia = mediaFiles.length + gifUrls.length;
  const canPost =
    (isQuote
      ? content.trim().length > 0
      : content.trim().length > 0 || totalMedia > 0) &&
    remaining >= 0 &&
    (!pollOptions || pollOptions.filter((o) => o.trim()).length >= MIN_POLL_OPTIONS);

  const submit = useCallback(() => {
    if (!canPost || compose.isPending || quoteRepost.isPending) return;

    const reset = () => {
      setContent("");
      setMediaFiles([]);
      setMediaPreview([]);
      setGifUrls([]);
      setPollOptions(null);
      void qc.invalidateQueries({ queryKey: ["feed"] });
      onPosted?.();
    };

    if (isQuote && quoteRepostId) {
      quoteRepost.mutate(
        { postId: quoteRepostId, content: content.trim() || " " },
        {
          onSuccess: reset,
          onError: (e) => onQuoteError?.(formatUserError(e)),
        },
      );
      return;
    }

    compose.mutate(
      {
        content: content.trim() || " ",
        mediaUris: mediaFiles.map((f) => ({
          blob: f,
          name: f.name,
          type: f.type,
        })),
        externalMediaUrls: gifUrls,
        replyToId,
        pollOptions: pollOptions ?? undefined,
      },
      { onSuccess: reset },
    );
  }, [
    canPost,
    compose,
    quoteRepost,
    isQuote,
    quoteRepostId,
    content,
    mediaFiles,
    gifUrls,
    pollOptions,
    replyToId,
    qc,
    onPosted,
    onQuoteError,
  ]);

  useImperativeHandle(ref, () => ({ submit }), [submit]);

  useEffect(() => {
    if (!pinToolbar && !isDrawerVariant) return;
    focusTextarea(textareaRef.current);
  }, [pinToolbar, isDrawerVariant, focusSession]);

  useEffect(() => {
    onComposeState?.({
      canPost,
      isPending: compose.isPending || quoteRepost.isPending,
    });
  }, [canPost, compose.isPending, quoteRepost.isPending, onComposeState]);

  if (!user) return null;

  const toolbarRow = (
    <>
      <div className="flex items-center text-accent -ml-2">
        <IconBtn
          label="Medya"
          onClick={() => fileRef.current?.click()}
          disabled={totalMedia >= MAX_MEDIA_PER_POST}
        >
          <ImageIcon className="h-5 w-5" />
        </IconBtn>
        <IconBtn
          label="GIF"
          onClick={() => setGifOpen(true)}
          disabled={totalMedia >= MAX_MEDIA_PER_POST}
        >
          <Smile className="h-5 w-5" />
        </IconBtn>
        <IconBtn
          label="Anket"
          onClick={() =>
            setPollOptions(pollOptions ? null : Array(MIN_POLL_OPTIONS).fill(""))
          }
          active={!!pollOptions}
        >
          <BarChart2 className="h-5 w-5" />
        </IconBtn>
        {!replyToId && !isReplyModal && (
          <IconBtn
            label="Sohbet odası"
            onClick={() => setSpaceOpen(true)}
            disabled={!liveAvailable}
          >
            <Users className="h-5 w-5" />
          </IconBtn>
        )}
      </div>
      <span
        className={cn(
          "text-[13px] tabular-nums shrink-0",
          remaining < 20 ? "text-like" : "text-text-secondary",
        )}
      >
        {remaining}
      </span>
    </>
  );

  const editor = (
    <div
      className={cn(
        "flex gap-3",
        pinToolbar ? "px-4 pb-2 shrink-0" : "min-h-0 flex-1",
        !hideAvatar && !isDrawerVariant && !pinToolbar && "gap-3",
      )}
    >
      {!hideAvatar ? (
        <Avatar
          src={user.avatarUrl}
          name={user.displayName}
          size="md"
          className={cn("shrink-0", !isDrawerVariant && "mt-1")}
        />
      ) : null}
      <div className={cn("flex min-h-0 flex-1 flex-col min-w-0", hideAvatar && "w-full")}>
        {replyToUsername && !isReplyModal ? (
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[13px] text-accent">
              Yanıtlanıyor{" "}
              <span className="font-bold">@{replyToUsername}</span>
            </p>
            {onClearReply ? (
              <button
                type="button"
                onClick={onClearReply}
                className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                aria-label="Yanıt hedefini kaldır"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, POST_MAX_LENGTH))}
          enterKeyHint="send"
          inputMode="text"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          placeholder={
            isReplyModal
              ? "Yanıtını gönder"
              : isMobileDrawer
                ? "Neler oluyor?"
                : replyToUsername
                  ? `@${replyToUsername} kullanıcısına yanıt yaz`
                  : replyToId
                    ? "Yanıtını yaz"
                    : "Neler oluyor?"
          }
          rows={pinToolbar ? 1 : isDrawerVariant ? 4 : 2}
          className={cn(
            "w-full bg-transparent placeholder:text-text-secondary outline-none resize-none",
            pinToolbar
              ? "min-h-[28px] text-[20px] leading-7"
              : isDrawerVariant
                ? "min-h-[120px] text-[20px] leading-7"
                : "min-h-[52px] text-[20px] leading-7 max-md:min-h-[44px] max-md:text-[17px] max-md:leading-6",
            !pinToolbar && "flex-1",
          )}
        />

        {(mediaPreview.length > 0 || gifUrls.length > 0) && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {mediaPreview.map((url) => (
              <MediaImage
                key={url}
                src={url}
                alt=""
                className="h-24 w-24 rounded-2xl border border-border"
              />
            ))}
            {gifUrls.map((url) => (
              <MediaImage
                key={url}
                src={url}
                alt="GIF"
                className="h-24 w-24 rounded-2xl border border-border"
              />
            ))}
          </div>
        )}

        {pollOptions && (
          <div className="mt-3 space-y-2 rounded-2xl border border-border p-3 bg-bg-secondary/50">
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const copy = [...pollOptions];
                  copy[i] = e.target.value;
                  setPollOptions(copy);
                }}
                placeholder={`Seçenek ${i + 1}`}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-accent"
              />
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).slice(
              0,
              MAX_MEDIA_PER_POST - totalMedia,
            );
            const cap = MAX_MEDIA_PER_POST - gifUrls.length;
            setMediaFiles((m) => [...m, ...files].slice(0, cap));
            setMediaPreview((p) => [
              ...p,
              ...files.map((f) => URL.createObjectURL(f)),
            ].slice(0, cap));
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        !isDrawerVariant &&
          "flex flex-col gap-0 px-4 py-3 border-b border-border hover:bg-bg-hover/40 transition-colors max-md:py-2.5",
        isDrawerVariant && "flex flex-1 min-h-0 flex-col",
        className,
      )}
    >
      {pinToolbar ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {replyContext ? (
              <div className="shrink-0 px-4 pt-2 pb-1">{replyContext}</div>
            ) : null}
            {editor}
          </div>
          <ComposeKeyboardToolbar>
            <div className="flex items-center justify-between px-3 py-2">{toolbarRow}</div>
          </ComposeKeyboardToolbar>
        </>
      ) : (
        <>
          {editor}
          <div
            className={cn(
              "flex items-center justify-between mt-3 pt-1",
              isDrawerVariant && "px-4",
            )}
          >
            <div className="flex items-center flex-1 min-w-0">{toolbarRow}</div>
            {!submitInHeader ? (
              <Button
                variant="accent"
                size="sm"
                disabled={!canPost || compose.isPending}
                onClick={submit}
                className={cn(
                  "min-w-[72px] font-bold ml-3 shrink-0 max-md:min-w-[100px] max-md:rounded-full max-md:px-4",
                  isReplyModal && "rounded-full px-5",
                )}
              >
                {compose.isPending ? "…" : submitLabel}
              </Button>
            ) : null}
          </div>
        </>
      )}

      <GifPicker
        open={gifOpen}
        onClose={() => setGifOpen(false)}
        onSelect={(gif) =>
          setGifUrls((g) =>
            [...g, gif.url].slice(0, MAX_MEDIA_PER_POST - mediaFiles.length),
          )
        }
      />

      <StartSpaceModal
        open={spaceOpen}
        onClose={() => setSpaceOpen(false)}
        liveAvailable={liveAvailable}
      />
    </div>
  );
});

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "p-2 rounded-full transition-colors hover:bg-accent/10 disabled:opacity-40",
        active && "text-accent bg-accent/10",
      )}
    >
      {children}
    </button>
  );
}
