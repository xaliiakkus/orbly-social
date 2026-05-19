"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { formatCount } from "@/lib/format";
import { cn } from "@/lib/cn";

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
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center gap-6 px-2 h-[53px]",
        "bg-bg-primary/80 backdrop-blur-md border-b border-border",
      )}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="p-2 -ml-1 rounded-full hover:bg-bg-hover transition-colors"
        aria-label="Geri"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        {displayName && (
          <p className="font-bold text-[20px] leading-6 truncate">{displayName}</p>
        )}
        {postsCount !== undefined && (
          <p className="text-text-secondary text-[13px] leading-4 truncate">
            {formatCount(postsCount)} gönderi
          </p>
        )}
      </div>
      {trailing}
    </div>
  );
}
