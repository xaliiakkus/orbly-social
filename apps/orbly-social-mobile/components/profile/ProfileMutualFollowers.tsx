import type { UserPublic } from "@orbly/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { formatCount } from "@/lib/format";

function mutualText(users: UserPublic[], totalCount: number): string {
  if (totalCount === 0) return "";
  const names = users.map((u) => `@${u.username}`);
  const others = totalCount - users.length;

  if (users.length === 1 && others <= 0) {
    return `Takip ettiğin ${names[0]} de takip ediyor`;
  }
  if (users.length >= 2 && others <= 0) {
    return `Takip ettiğin ${names[0]}, ${names[1]} de takip ediyor`;
  }
  const shown = names.slice(0, 2).join(", ");
  const rest = others > 0 ? others : Math.max(0, totalCount - 2);
  return `Takip ettiğin ${shown}${rest > 0 ? ` ve ${formatCount(rest)} kişi daha` : ""} de takip ediyor`;
}

export function ProfileMutualFollowers({
  users,
  totalCount,
}: {
  users: UserPublic[];
  totalCount: number;
}) {
  const router = useRouter();
  if (totalCount === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.avatars}>
        {users.slice(0, 3).map((u, i) => (
          <Pressable
            key={u.id}
            style={[styles.avatarWrap, i > 0 && styles.avatarOverlap]}
            onPress={() => router.push(`/profile/${u.username}`)}
          >
            <UserAvatar name={u.displayName} uri={u.avatarUrl} size="sm" border />
          </Pressable>
        ))}
      </View>
      <Text style={styles.text}>{mutualText(users, totalCount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  avatars: { flexDirection: "row" },
  avatarWrap: {},
  avatarOverlap: { marginLeft: -8 },
  text: { flex: 1, fontSize: 13, color: OrblyColors.textSecondary, lineHeight: 18 },
});
