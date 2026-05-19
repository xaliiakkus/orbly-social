import Image from "next/image";
import Link from "next/link";

import { BRAND_LOGO_SRC } from "@/lib/brand";
import { cn } from "@/lib/cn";

const LOGO_PX = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 128,
  header: 32,
} as const;

type LogoSize = keyof typeof LOGO_PX;

function logoSrcForSize(size: LogoSize) {
  const px = LOGO_PX[size];
  const mapped = px <= 32 ? 32 : px <= 48 ? 48 : px <= 64 ? 64 : 128;
  return `/icons/icon-${mapped}.png`;
}

export function Logo({
  className,
  size = "header",
  linked = true,
}: {
  className?: string;
  size?: LogoSize;
  linked?: boolean;
}) {
  const px = LOGO_PX[size];
  const src = size === "header" ? BRAND_LOGO_SRC : logoSrcForSize(size);
  const img = (
    <Image
      src={src}
      alt=""
      width={px}
      height={px}
      className={cn("object-contain", className)}
      priority={size === "header" || size === "xl"}
    />
  );

  if (!linked) {
    return <span className={cn("inline-flex", className)}>{img}</span>;
  }

  return (
    <Link href="/home" className={cn("inline-flex", className)} aria-label="Orbly ana sayfa">
      {img}
    </Link>
  );
}

export function OrblyWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-xl font-extrabold tracking-tight bg-gradient-to-r from-accent to-orbit bg-clip-text text-transparent",
        className,
      )}
    >
      Orbly
    </span>
  );
}
