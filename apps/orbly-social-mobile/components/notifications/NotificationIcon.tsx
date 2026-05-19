import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { NotificationIconKind } from "@orbly/features";

import { OrblyColors } from "@/constants/Colors";

const colors: Record<NotificationIconKind, string> = {
  like: OrblyColors.like,
  reply: OrblyColors.reply,
  repost: OrblyColors.repost,
  follow: OrblyColors.accent,
  mention: OrblyColors.accent,
  orbit: OrblyColors.orbit,
  bell: OrblyColors.accent,
};

export function NotificationIcon({ kind }: { kind: NotificationIconKind }) {
  const color = colors[kind];
  switch (kind) {
    case "like":
      return <FontAwesome name="heart" size={19} color={color} />;
    case "reply":
      return <FontAwesome name="comment" size={19} color={color} />;
    case "repost":
      return <FontAwesome name="retweet" size={19} color={color} />;
    case "follow":
      return <FontAwesome name="user-plus" size={17} color={color} />;
    case "mention":
      return <FontAwesome name="at" size={19} color={color} />;
    case "orbit":
      return <FontAwesome name="star" size={18} color={color} />;
    default:
      return <FontAwesome name="bell" size={18} color={color} />;
  }
}
