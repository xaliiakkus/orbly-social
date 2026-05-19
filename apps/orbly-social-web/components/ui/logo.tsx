import Image from "next/image";
import Link from "next/link";

import { BRAND_LOGO_SRC, brandLogoDisplaySize } from "@/lib/brand";
import { cn } from "@/lib/cn";

const LOGO_HEIGHT = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 128,
  header: 32,
} as const;

type LogoSize = keyof typeof LOGO_HEIGHT;

export function Logo({
  className,
  size = "header",
  linked = true,
}: {
  className?: string;
  size?: LogoSize;
  linked?: boolean;
}) {
  const { width, height } = brandLogoDisplaySize(LOGO_HEIGHT[size]);
  const img = (
    <Image
      src={BRAND_LOGO_SRC}
      alt="Orbly"
      width={width}
      height={height}
      className="object-contain shrink-0"
      priority={size === "header" || size === "xl"}
    />
  );

  const wrapClass = cn("inline-flex shrink-0 items-center", className);

  if (!linked) {
    return <span className={wrapClass}>{img}</span>;
  }

  return (
    <Link href="/home" className={wrapClass} aria-label="Orbly ana sayfa">
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
