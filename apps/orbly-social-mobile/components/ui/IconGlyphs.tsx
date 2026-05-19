import type { ComponentProps } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";

export function FaIcon(props: ComponentProps<typeof FontAwesome>) {
  return <FontAwesome {...props} />;
}

export function IonIcon(props: ComponentProps<typeof Ionicons>) {
  return <Ionicons {...props} />;
}
