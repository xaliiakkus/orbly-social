"use client";

import { cn } from "@/lib/cn";

export function LiveReplayPlayer({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full bg-black rounded-xl overflow-hidden border border-border", className)}>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="w-full max-h-[50vh] aspect-video object-contain bg-black"
        title={title}
      />
    </div>
  );
}
