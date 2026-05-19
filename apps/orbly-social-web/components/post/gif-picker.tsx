"use client";

import type { GifItem } from "@orbly/types";
import { useGifSearch } from "@orbly/features";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/cn";

export function GifPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (gif: GifItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data, isLoading, isError } = useGifSearch(debounced, open);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-bg-secondary border border-border rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="GIF ara…"
            className="flex-1 bg-bg-primary border border-border rounded-full px-4 py-2 text-[15px] outline-none"
            autoFocus
          />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>
        <div className="p-3 max-h-[50vh] overflow-y-auto">
          {isLoading && (
            <p className="text-center text-text-secondary py-8">Yükleniyor…</p>
          )}
          {isError && (
            <p className="text-center text-text-secondary py-8">
              GIF araması kullanılamıyor (TENOR_API_KEY)
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {data?.data.map((gif) => (
              <button
                key={gif.id}
                type="button"
                className={cn(
                  "rounded-xl overflow-hidden border border-border hover:border-accent focus:border-accent",
                )}
                onClick={() => {
                  onSelect(gif);
                  onClose();
                }}
              >
                <MediaImage
                  src={gif.previewUrl}
                  alt=""
                  className="h-28 w-full"
                  sizes="50vw"
                />
              </button>
            ))}
          </div>
          {!isLoading && !isError && !data?.data.length && (
            <p className="text-center text-text-secondary py-8">Sonuç yok</p>
          )}
        </div>
      </div>
    </div>
  );
}
