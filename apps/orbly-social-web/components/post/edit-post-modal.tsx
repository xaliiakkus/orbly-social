"use client";

import { POST_MAX_LENGTH } from "@orbly/features";
import type { PostPublic } from "@orbly/types";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function EditPostModal({
  post,
  open,
  saving,
  error,
  onClose,
  onSave,
}: {
  post: PostPublic;
  open: boolean;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState(post.content);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setContent(post.content);
  }, [open, post.content]);

  if (!open || !mounted) return null;

  const remaining = POST_MAX_LENGTH - content.length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-bg-primary shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-bold">Gönderiyi düzenle</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-text-secondary hover:bg-bg-hover"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 pb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, POST_MAX_LENGTH))}
            rows={5}
            className="w-full resize-none rounded-xl border border-border bg-bg-primary px-3 py-2 text-[15px] text-text-primary outline-none focus:border-accent"
            autoFocus
          />
          <p
            className={cn(
              "mt-1 text-right text-[13px]",
              remaining < 20 ? "text-like" : "text-text-secondary",
            )}
          >
            {remaining}
          </p>
          {error ? <p className="mt-2 text-sm text-like">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              İptal
            </Button>
            <Button onClick={() => onSave(content)} disabled={saving || !content.trim()}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
