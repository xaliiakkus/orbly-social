import type { UserPublic } from "@orbly/types";
import { StyleSheet, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";

export function NotificationAvatarStack({ actors }: { actors: UserPublic[] }) {
  const shown = actors.slice(0, 3);
  if (shown.length === 0) return null;

  return (
    <View style={styles.row}>
      {shown.map((actor, i) => (
        <View key={actor.id} style={[styles.wrap, i > 0 && styles.overlap]}>
          <UserAvatar name={actor.displayName} uri={actor.avatarUrl} size="sm" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  wrap: {
    borderWidth: 2,
    borderColor: OrblyColors.bgPrimary,
    borderRadius: 999,
  },
  overlap: { marginLeft: -10 },
});
