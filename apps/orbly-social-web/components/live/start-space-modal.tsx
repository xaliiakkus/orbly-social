"use client";

import { formatUserError } from "@orbly/api-client";
import { Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { api } from "@/lib/api";

export function StartSpaceModal({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
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
        title: title.trim() || "Sohbet odası",
        kind: "space",
        mode: "audio",
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
          <h2 className="text-xl font-bold">Sohbet odası başlat</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-bg-hover">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-text-secondary text-[15px] mb-4 leading-relaxed">
          Herkese açık sesli oda. Dinleyiciler konuşma isteyebilir; sen onaylayınca mikrofon
          açılır — X Spaces gibi.
        </p>

        <label className="block rounded border border-border mb-6 focus-within:border-accent">
          <span className="block px-3 pt-2 text-[13px] text-text-secondary">Oda başlığı</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Konu başlığı"
            maxLength={120}
            className="w-full bg-transparent px-3 pb-2 pt-1 text-[17px] outline-none"
          />
        </label>

        {!liveAvailable && (
          <p className="text-text-secondary text-sm mb-4 rounded-lg border border-border bg-bg-secondary/50 p-3 text-center">
            Sohbet odaları şu an kullanılamıyor.
          </p>
        )}

        {error && <p className="text-like text-sm mb-3">{error}</p>}

        <button
          type="button"
          disabled={loading || !liveAvailable}
          onClick={() => void start()}
          className="w-full py-3 rounded-full bg-accent font-bold text-white hover:bg-accent-hover disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <Users className="h-5 w-5" />
          {loading ? "Açılıyor…" : "Odayı aç"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
