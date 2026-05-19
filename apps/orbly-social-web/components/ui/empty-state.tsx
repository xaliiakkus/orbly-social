import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-8 py-16 flex flex-col items-center text-center", className)}>
      <div className="h-16 w-16 rounded-full bg-bg-secondary border border-border flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-orbit" />
      </div>
      <p className="text-xl font-bold">{title}</p>
      {description && (
        <p className="text-text-secondary text-[15px] mt-2 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
