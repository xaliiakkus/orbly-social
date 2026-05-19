export function FeedSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4 animate-pulse">
          <div className="h-10 w-10 shrink-0 rounded-full bg-bg-secondary" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="flex gap-2">
              <div className="h-4 w-28 rounded bg-bg-secondary" />
              <div className="h-4 w-20 rounded bg-bg-secondary" />
            </div>
            <div className="h-4 w-full max-w-md rounded bg-bg-secondary" />
            <div className="h-4 w-4/5 max-w-sm rounded bg-bg-secondary" />
            <div className="h-48 w-full max-w-md rounded-2xl bg-bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
