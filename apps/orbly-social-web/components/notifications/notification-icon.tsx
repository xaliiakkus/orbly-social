import type { NotificationIconKind } from "@orbly/features";
import { AtSign, Bell, Heart, MessageCircle, Repeat2, Sparkles, UserPlus } from "lucide-react";

import { cn } from "@/lib/cn";

const styles: Record<NotificationIconKind, string> = {
  like: "text-like fill-like",
  reply: "text-reply",
  repost: "text-repost",
  follow: "text-accent",
  mention: "text-accent",
  orbit: "text-orbit",
  bell: "text-accent",
};

export function NotificationIcon({
  kind,
  className,
}: {
  kind: NotificationIconKind;
  className?: string;
}) {
  const iconClass = cn("h-[19px] w-[19px] shrink-0", styles[kind], className);
  switch (kind) {
    case "like":
      return <Heart className={cn(iconClass, "fill-current")} strokeWidth={0} />;
    case "reply":
      return <MessageCircle className={iconClass} />;
    case "repost":
      return <Repeat2 className={iconClass} />;
    case "follow":
      return <UserPlus className={iconClass} />;
    case "mention":
      return <AtSign className={iconClass} />;
    case "orbit":
      return <Sparkles className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
}
