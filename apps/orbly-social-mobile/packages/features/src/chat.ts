import type { MessageItem, UserPublic } from "@orbly/types";

export function normalizeUserId(id: string | null | undefined): string {
  return (id ?? "").trim().toLowerCase();
}

/** senderId ile oturum kullanıcı id'sini güvenli karşılaştır */
export function isMessageMine(
  senderId: string,
  currentUserId: string | null | undefined,
): boolean {
  if (!currentUserId) return false;
  return normalizeUserId(senderId) === normalizeUserId(currentUserId);
}

export function resolveMessageSender(
  message: MessageItem,
  me: UserPublic | null | undefined,
  other: UserPublic | null | undefined,
): UserPublic | null {
  if (message.sender) return message.sender;
  if (me && isMessageMine(message.senderId, me.id)) return me;
  if (other && isMessageMine(message.senderId, other.id)) return other;
  return other ?? me ?? null;
}
