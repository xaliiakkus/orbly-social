"use client";

import { ImagePlus, Send } from "lucide-react";
import { useRef } from "react";

import { cn } from "@/lib/cn";

export function ChatComposer({
  text,
  onTextChange,
  onSubmit,
  onAttach,
  disabled,
  pending,
}: {
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  onAttach?: (file: File) => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 border-t border-border bg-bg-primary/95 backdrop-blur-md px-3 py-3">
      <form
        className="flex items-end gap-2 max-w-3xl mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {onAttach ? (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-full text-accent hover:bg-accent/10 transition-colors shrink-0"
              aria-label="Medya ekle"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAttach(f);
                e.target.value = "";
              }}
            />
          </>
        ) : null}

        <div className="flex-1 flex items-end gap-2 rounded-3xl border border-border bg-bg-secondary/60 px-4 py-2 shadow-inner shadow-black/5 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/15 transition-all">
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={1}
            placeholder="Mesaj yaz…"
            disabled={disabled}
            className="flex-1 bg-transparent text-[15px] outline-none resize-none min-h-[24px] max-h-32 py-1.5 leading-snug"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled || pending}
          className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-all",
            text.trim()
              ? "bg-accent text-white shadow-lg shadow-accent/25 hover:brightness-110"
              : "bg-bg-secondary text-text-tertiary",
          )}
          aria-label="Gönder"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
