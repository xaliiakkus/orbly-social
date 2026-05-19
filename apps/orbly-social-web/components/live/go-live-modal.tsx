"use client";

import { formatUserError } from "@orbly/api-client";
import { Mic, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

export function GoLiveModal({
  open,
  onClose,
  liveAvailable = true,
}: {
  open: boolean;
  onClose: () => void;
  liveAvailable?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"audio" | "video">("video");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setMode("video");
    setError("");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const start = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.live.start({
        title: title.trim() || "Canlı yayın",
        mode,
      });
      onClose();
      router.push(`/live/${res.channel.id}`);
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-bg-primary border border-border p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Canlı yayın başlat</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-bg-hover">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-text-secondary text-[15px] mb-4">
          Sesli veya görüntülü yayın yap; kamera ve ekran paylaşımı desteklenir.
        </p>

        <label className="block rounded border border-border mb-4 focus-within:border-accent">
          <span className="block px-3 pt-2 text-[13px] text-text-secondary">Başlık</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yayın başlığı"
            maxLength={120}
            className="w-full bg-transparent px-3 pb-2 pt-1 text-[17px] outline-none"
          />
        </label>

        <p className="text-[13px] text-text-secondary mb-2">Yayın türü</p>
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("audio")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-full border font-bold text-[15px] transition-colors",
              mode === "audio"
                ? "bg-text-primary text-bg-primary border-text-primary"
                : "border-border hover:bg-bg-hover",
            )}
          >
            <Mic className="h-5 w-5" />
            Sesli
          </button>
          <button
            type="button"
            onClick={() => setMode("video")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-full border font-bold text-[15px] transition-colors",
              mode === "video"
                ? "bg-text-primary text-bg-primary border-text-primary"
                : "border-border hover:bg-bg-hover",
            )}
          >
            <Video className="h-5 w-5" />
            Görüntülü
          </button>
        </div>

        {!liveAvailable && (
          <p className="text-text-secondary text-sm mb-4 rounded-lg border border-border bg-bg-secondary/50 p-3 text-center">
            Canlı yayın şu an kullanılamıyor.
          </p>
        )}

        {error && <p className="text-like text-sm mb-3">{error}</p>}

        <button
          type="button"
          disabled={loading || !liveAvailable}
          onClick={() => void start()}
          className="w-full py-3 rounded-full bg-like font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Başlatılıyor…" : "Yayına başla"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
