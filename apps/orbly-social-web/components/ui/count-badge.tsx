"use client";

import { formatNavBadgeCount } from "@orbly/features";

import { cn } from "@/lib/cn";

export function CountBadge({
  count,
  className,
  variant = "nav",
  ariaLabelPrefix = "okunmamış",
}: {
  count: number;
  className?: string;
  variant?: "nav" | "inline";
  ariaLabelPrefix?: string;
}) {
  const label = formatNavBadgeCount(count);
  if (!label) return null;

  return (
    <span
      className={cn(
        "rounded-full bg-accent text-white font-bold text-center shrink-0",
        variant === "nav" &&
          "absolute top-0.5 left-[calc(50%+10px)] min-w-[18px] h-[18px] px-1 text-[11px] leading-[18px]",
        variant === "inline" && "min-w-[20px] h-5 px-1.5 text-[11px] leading-5",
        className,
      )}
      aria-label={`${label} ${ariaLabelPrefix}`}
    >
      {label}
    </span>
  );
}
