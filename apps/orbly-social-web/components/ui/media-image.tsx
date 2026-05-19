"use client";

import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";

export function MediaImage({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return null;
  return (
    <img
      src={resolved}
      alt={alt}
      className={cn("bg-bg-secondary object-cover", className)}
      loading="lazy"
    />
  );
}
