import { cn } from "@/lib/cn";

export function PageLoading({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-border animate-pulse", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-bg-secondary" />
          <div className="flex-1 space-y-2.5 pt-1">
            <div className="h-4 w-32 rounded bg-bg-secondary" />
            <div className="h-4 w-full max-w-md rounded bg-bg-secondary" />
            <div className="h-4 w-2/3 max-w-xs rounded bg-bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
