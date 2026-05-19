"use client";

import Image from "next/image";

import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";

function needsUnoptimized(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

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

  return (
    <div className={cn("relative overflow-hidden bg-bg-secondary", className)}>
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={needsUnoptimized(resolved)}
        className="object-cover"
      />
    </div>
  );
}
