"use client";

import { PenLine, Radio, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { GoLiveModal } from "@/components/live/go-live-modal";
import { StartSpaceModal } from "@/components/live/start-space-modal";
import { useLiveList } from "@orbly/features";
import { cn } from "@/lib/cn";

export function MobileQuickActions({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useLiveList();
  const liveAvailable = data?.configured === true;
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const pick = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <div
            className={cn(
              "absolute bottom-0 inset-x-0 rounded-t-2xl bg-bg-primary border-t border-border",
              "pb-[max(1rem,env(safe-area-inset-bottom))]",
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-extrabold">Oluştur</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-bg-hover"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2">
              <Link
                href="/home"
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-bg-hover transition-colors"
              >
                <PenLine className="h-[26px] w-[26px]" />
                <div>
                  <p className="font-bold text-[17px]">Gönderi yaz</p>
                  <p className="text-text-secondary text-[13px]">
                    Ana sayfada paylaş
                  </p>
                </div>
              </Link>
              <button
                type="button"
                disabled={!liveAvailable}
                onClick={() => pick(() => setSpaceOpen(true))}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-bg-hover transition-colors disabled:opacity-50 text-left"
              >
                <Users className="h-[26px] w-[26px]" />
                <div>
                  <p className="font-bold text-[17px]">Sohbet odası</p>
                  <p className="text-text-secondary text-[13px]">
                    Sesli oda başlat
                  </p>
                </div>
              </button>
              <button
                type="button"
                disabled={!liveAvailable}
                onClick={() => pick(() => setGoLiveOpen(true))}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-bg-hover transition-colors disabled:opacity-50 text-left"
              >
                <Radio className="h-[26px] w-[26px]" />
                <div>
                  <p className="font-bold text-[17px]">Canlı yayın</p>
                  <p className="text-text-secondary text-[13px]">
                    Görüntülü yayına başla
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      <GoLiveModal
        open={goLiveOpen}
        onClose={() => setGoLiveOpen(false)}
        liveAvailable={liveAvailable}
      />
      <StartSpaceModal
        open={spaceOpen}
        onClose={() => setSpaceOpen(false)}
        liveAvailable={liveAvailable}
      />
    </>
  );
}
