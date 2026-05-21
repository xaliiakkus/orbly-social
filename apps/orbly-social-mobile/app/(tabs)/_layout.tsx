import { Ionicons } from "@/components/ui/icons";
import { formatNavBadgeCount, useConversationsUnreadCount, useNotificationUnreadCount } from "@orbly/features";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { useAuthStore } from "@/lib/auth-store";

type IonIcon = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(
  outline: IonIcon,
  filled: IonIcon,
): (props: { color: string; focused: boolean }) => React.ReactElement {
  return ({ color, focused }) => (
    <Ionicons name={focused ? filled : outline} size={26} color={color} />
  );
}

export default function TabLayout() {
  const authed = useAuthStore((s) => !!s.accessToken);
  const { data: notifUnread = 0 } = useNotificationUnreadCount({ enabled: authed });
  const { data: msgUnread = 0 } = useConversationsUnreadCount({ enabled: authed });
  const notifBadge = formatNavBadgeCount(notifUnread);
  const msgBadge = formatNavBadgeCount(msgUnread);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: OrblyColors.textPrimary,
        tabBarInactiveTintColor: OrblyColors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: OrblyColors.bgPrimary,
          borderTopColor: OrblyColors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_BAR_HEIGHT,
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: OrblyColors.bgPrimary },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: tabIcon("home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Keşfet",
          tabBarIcon: tabIcon("search-outline", "search"),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "Canlı",
          tabBarIcon: tabIcon("radio-outline", "radio"),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Bildirimler",
          tabBarIcon: tabIcon("notifications-outline", "notifications"),
          tabBarBadge: notifBadge,
          tabBarBadgeStyle: {
            backgroundColor: OrblyColors.accent,
            color: "#fff",
            fontSize: 11,
            minWidth: 18,
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Mesajlar",
          tabBarIcon: tabIcon("mail-outline", "mail"),
          tabBarBadge: msgBadge,
          tabBarBadgeStyle: {
            backgroundColor: OrblyColors.accent,
            color: "#fff",
            fontSize: 11,
            minWidth: 18,
          },
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
