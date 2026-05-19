export function ProfileSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-50 h-[53px] bg-bg-primary border-b border-border animate-pulse" />
      <div className="aspect-[3/1] max-h-[200px] bg-bg-secondary animate-pulse" />
      <div className="px-4 pb-4">
        <div className="-mt-[68px] mb-4 h-[134px] w-[134px] max-sm:h-[84px] max-sm:w-[84px] rounded-full bg-bg-secondary border-4 border-bg-primary animate-pulse" />
        <div className="space-y-2 pt-2">
          <div className="h-5 w-40 bg-bg-secondary rounded animate-pulse" />
          <div className="h-4 w-28 bg-bg-secondary rounded animate-pulse" />
          <div className="h-4 w-full max-w-md bg-bg-secondary rounded animate-pulse mt-3" />
          <div className="h-4 w-48 bg-bg-secondary rounded animate-pulse" />
        </div>
      </div>
      <div className="h-[53px] border-b border-border bg-bg-secondary/50 animate-pulse" />
    </>
  );
}
