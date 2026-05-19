import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="px-4 pb-2 text-[13px] font-bold uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      <div className="border-y border-border divide-y divide-border bg-bg-secondary/30">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  icon: Icon,
  label,
  hint,
  href,
  onClick,
  danger,
  trailing,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  const inner = (
    <>
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          danger ? "text-like" : "text-text-secondary",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium text-[15px]", danger && "text-like")}>{label}</p>
        {hint && <p className="text-text-secondary text-[13px] truncate">{hint}</p>}
      </div>
      {trailing}
    </>
  );

  const className =
    "flex items-center gap-4 px-4 py-3.5 hover:bg-bg-hover transition-colors w-full text-left";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
