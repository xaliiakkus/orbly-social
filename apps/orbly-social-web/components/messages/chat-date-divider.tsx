export function ChatDateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="flex-1 h-px bg-border/80" />
      <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide px-2 py-1 rounded-full bg-bg-secondary/80 border border-border/50">
        {label}
      </span>
      <span className="flex-1 h-px bg-border/80" />
    </div>
  );
}
