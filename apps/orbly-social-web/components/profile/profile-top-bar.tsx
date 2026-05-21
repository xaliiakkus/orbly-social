"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { formatCount } from "@/lib/format";

export function ProfileTopBar({
  displayName,
  postsCount,
  trailing,
}: {
  displayName?: string;
  postsCount?: number;
  trailing?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-50 flex items-center gap-4 px-4 py-3 min-h-[53px] bg-bg-primary/80 backdrop-blur-md border-b border-border">
      <button
        type="button"
        onClick={() => router.back()}
        className="p-2 -ml-2 rounded-full hover:bg-bg-hover transition-colors shrink-0"
        aria-label="Geri"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        {displayName ? (
          <h1 className="font-bold text-[20px] leading-none truncate">{displayName}</h1>
        ) : null}
        {postsCount !== undefined ? (
          <p className="text-[13px] text-text-secondary mt-0.5 truncate">
            {formatCount(postsCount)} gönderi
          </p>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}
