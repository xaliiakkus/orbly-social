import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { formatCount } from "@/lib/format";

export function trendMetaLine(postCount: number, category = "Gündemdekiler"): string {
  if (postCount >= 10_000) {
    return `Türkiye tarihinde gündemde · ${formatCount(postCount)} gönderi`;
  }
  return `${category} · ${formatCount(postCount)} gönderi`;
}

export function ExploreTrendRow({
  title,
  meta,
  href,
}: {
  title: string;
  meta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-2 px-4 py-3.5 border-b border-border hover:bg-bg-hover/60 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-[18px] text-text-secondary truncate">{meta}</p>
        <p className="mt-0.5 text-[17px] font-bold leading-[22px] text-text-primary">{title}</p>
      </div>
      <button
        type="button"
        className="shrink-0 p-1 rounded-full text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        aria-label="Seçenekler"
        onClick={(e) => e.preventDefault()}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </button>
    </Link>
  );
}
