"use client";

import { useVisualViewportBottom } from "@/lib/use-visual-viewport-bottom";
import { cn } from "@/lib/cn";

export const COMPOSE_TOOLBAR_HEIGHT = 48;

export function getComposeToolbarHeight() {
  return COMPOSE_TOOLBAR_HEIGHT;
}

/** X mobil: klavyenin hemen üstü — compose sütununun en altında (portal yok). */
export function ComposeKeyboardToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const keyboardBottom = useVisualViewportBottom();

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border bg-bg-primary",
        className,
      )}
      style={{
        minHeight: COMPOSE_TOOLBAR_HEIGHT,
        paddingBottom:
          keyboardBottom > 0 ? 0 : "max(0px, env(safe-area-inset-bottom))",
      }}
    >
      {children}
    </div>
  );
}
