"use client";

import Image from "next/image";

import { resolveMediaUrl, shouldBypassNextImageOptimizer } from "@/lib/media-url";
import { cn } from "@/lib/cn";

export function MediaImage({
  src,
  alt = "",
  className,
  sizes = "96px",
}: {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return null;

  if (shouldBypassNextImageOptimizer(resolved)) {
    return (
      // Harici medya: doğrudan <img> — fill/layout ve _next/image 400 sorunları yok
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("block max-w-full bg-bg-secondary object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-bg-secondary min-h-[48px]", className)}>
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
