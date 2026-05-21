"use client";

import { Link2, Quote, Repeat2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

import { cn } from "@/lib/cn";

export function RepostMenu({
  reposted,
  onRepost,
  onUnrepost,
  onQuote,
  onCopyLink,
  disabled,
}: {
  reposted: boolean;
  onRepost: () => void;
  onUnrepost: () => void;
  onQuote: () => void;
  onCopyLink?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleToggle = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "repost-action-group flex items-center gap-1.5 p-2 rounded-full transition-all",
          reposted
            ? "text-repost repost-active"
            : "text-text-secondary hover:text-repost",
          disabled && "opacity-40 cursor-not-allowed",
        )}
        aria-label="Yeniden paylaş"
        aria-expanded={open}
      >
        <span className="repost-action-bg rounded-full p-1 -m-1 transition-colors">
          <Repeat2 className={cn("h-[18px] w-[18px]", reposted && "fill-current/20")} />
        </span>
      </button>
      {open ? (
        <div
          className="absolute left-0 bottom-full mb-2 z-30 min-w-[220px] rounded-xl border border-border bg-bg-primary shadow-xl overflow-hidden"
          onClick={(e: ReactMouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {reposted ? (
            <MenuItem
              icon={Undo2}
              label="Yeniden paylaşımı geri al"
              onClick={() => {
                setOpen(false);
                onUnrepost();
              }}
            />
          ) : (
            <MenuItem
              icon={Repeat2}
              label="Yeniden paylaş"
              onClick={() => {
                setOpen(false);
                onRepost();
              }}
            />
          )}
          <MenuItem
            icon={Quote}
            label="Alıntıla"
            onClick={() => {
              setOpen(false);
              onQuote();
            }}
          />
          <MenuItem
            icon={Link2}
            label="Bağlantıyı kopyala"
            onClick={() => {
              setOpen(false);
              onCopyLink?.();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Repeat2;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-[15px] hover:bg-bg-hover text-left",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </button>
  );
}
