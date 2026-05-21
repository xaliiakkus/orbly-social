export function ProfileSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-50 h-[53px] bg-bg-primary/80 border-b border-border animate-pulse" />
      <div className="h-48 gradient-banner animate-pulse" />
      <div className="px-4 pb-4 relative">
        <div className="absolute -top-16 left-4 h-32 w-32 rounded-full bg-bg-secondary border-4 border-bg-primary animate-pulse" />
        <div className="flex justify-end gap-2 pt-4 pb-3 min-h-[52px]">
          <div className="h-9 w-9 rounded-full bg-bg-secondary animate-pulse" />
          <div className="h-9 w-9 rounded-full bg-bg-secondary animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-bg-secondary animate-pulse" />
        </div>
        <div className="mt-12 space-y-2">
          <div className="h-6 w-44 bg-bg-secondary rounded animate-pulse" />
          <div className="h-4 w-28 bg-bg-secondary rounded animate-pulse" />
          <div className="h-4 w-full max-w-md bg-bg-secondary rounded animate-pulse mt-3" />
          <div className="h-4 w-56 bg-bg-secondary rounded animate-pulse" />
        </div>
      </div>
      <div className="h-[53px] border-b border-border bg-bg-secondary/50 animate-pulse" />
    </>
  );
}
