import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-32 w-32 text-3xl",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const resolved = resolveMediaUrl(src);
  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name}
        className={cn("rounded-full object-cover bg-bg-secondary", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-bg-secondary font-bold text-text-primary",
        sizes[size],
        className,
      )}
    >
      {initial}
    </div>
  );
}
