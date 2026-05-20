"use client";

import { usePostReposters } from "@orbly/features";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function RepostersModal({
  postId,
  open,
  onClose,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePostReposters(postId, open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const users = data?.pages.flatMap((p) => p.data) ?? [];

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[420px] max-h-[min(520px,80vh)] flex flex-col rounded-2xl bg-bg-primary border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="reposters-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 id="reposters-title" className="text-[20px] font-bold">
            Yeniden paylaşanlar
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-hover"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-border">
          {isLoading ? (
            <li className="px-4 py-8 text-center text-text-secondary text-[15px]">
              Yükleniyor…
            </li>
          ) : users.length === 0 ? (
            <li className="px-4 py-8 text-center text-text-secondary text-[15px]">
              Henüz yeniden paylaşım yok.
            </li>
          ) : (
            users.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/profile/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover"
                >
                  <Avatar src={u.avatarUrl} name={u.displayName} size="md" />
                  <div className="min-w-0">
                    <p className="font-bold truncate">{u.displayName}</p>
                    <p className="text-text-secondary truncate">@{u.username}</p>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
        {hasNextPage ? (
          <div className="p-3 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? "Yükleniyor…" : "Daha fazla"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
