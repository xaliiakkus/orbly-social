import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-border",
        className,
      )}
    >
      <div className="px-4 py-3 flex flex-col gap-3 min-h-[53px] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-text-secondary text-[13px] mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex flex-wrap gap-2 w-full sm:w-auto">{action}</div>
        )}
      </div>
    </header>
  );
}
