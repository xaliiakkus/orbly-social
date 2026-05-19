import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-bold transition-colors disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-sm rounded-full",
        size === "md" && "px-4 py-2 text-sm rounded-full",
        size === "lg" && "px-6 py-3 text-base rounded-full",
        variant === "primary" &&
          "bg-text-primary text-bg-primary hover:opacity-90",
        variant === "accent" &&
          "bg-accent text-white hover:bg-accent-hover disabled:opacity-50",
        variant === "outline" &&
          "border border-border text-text-primary hover:bg-bg-hover",
        variant === "ghost" && "text-text-primary hover:bg-bg-hover rounded-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
