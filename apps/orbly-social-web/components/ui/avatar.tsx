import Image from "next/image";

import { resolveMediaUrl, shouldBypassNextImageOptimizer } from "@/lib/media-url";
import { cn } from "@/lib/cn";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-32 w-32 text-3xl",
};

const imageSizes: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "32px",
  md: "40px",
  lg: "48px",
  xl: "134px",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const resolved = resolveMediaUrl(src);
  if (resolved) {
    return (
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden rounded-full bg-bg-secondary",
          sizes[size],
          className,
        )}
      >
        {shouldBypassNextImageOptimizer(resolved) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolved}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={resolved}
            alt={name}
            fill
            sizes={imageSizes[size]}
            className="object-cover"
          />
        )}
      </span>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-bg-secondary font-bold text-text-primary",
        sizes[size],
        className,
      )}
    >
      {initial}
    </div>
  );
}
