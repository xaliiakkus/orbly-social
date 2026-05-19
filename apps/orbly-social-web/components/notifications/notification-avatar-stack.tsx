import type { UserPublic } from "@orbly/types";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export function NotificationAvatarStack({
  actors,
  className,
}: {
  actors: UserPublic[];
  className?: string;
}) {
  const shown = actors.slice(0, 3);
  if (shown.length === 0) return null;

  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((actor, i) => (
        <div
          key={actor.id}
          className={cn("rounded-full ring-2 ring-bg-primary", i > 0 && "-ml-2")}
          style={{ zIndex: shown.length - i }}
        >
          <Avatar src={actor.avatarUrl} name={actor.displayName} size="sm" />
        </div>
      ))}
    </div>
  );
}
