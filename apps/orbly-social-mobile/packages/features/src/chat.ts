import type { ConversationItem, MessageItem, UserPublic } from "@orbly/types";

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

export function isSameChatSender(a: string, b: string): boolean {
  return normalizeUserId(a) === normalizeUserId(b);
}

/** Sohbet listesi önizleme metni */
export function formatConversationPreview(
  lastMessage: ConversationItem["lastMessage"],
  viewerId?: string | null,
): string {
  if (!lastMessage) return "Sohbet başlat";
  const prefix =
    viewerId && isMessageMine(lastMessage.senderId, viewerId) ? "Sen: " : "";
  const raw = lastMessage.content?.trim();
  if (!raw) return `${prefix}📷 Medya`;
  if (raw === "📎") return `${prefix}📷 Medya`;
  return `${prefix}${raw}`;
}

export function formatChatDateLabel(iso: string, locale = "tr-TR"): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 86_400_000;
  const diffDays = Math.floor(
    (startOfDay(now) - startOfDay(date)) / dayMs,
  );
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatMessageTime(iso: string, locale = "tr-TR"): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type MessageDayGroup = {
  dateKey: string;
  label: string;
  messages: MessageItem[];
};

export function groupMessagesByDay(messages: MessageItem[]): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  for (const message of messages) {
    const dateKey = message.createdAt.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last?.dateKey === dateKey) {
      last.messages.push(message);
    } else {
      groups.push({
        dateKey,
        label: formatChatDateLabel(message.createdAt),
        messages: [message],
      });
    }
  }
  return groups;
}

/** Ardışık aynı gönderen — avatar en alttaki balonda */
export function shouldShowMessageAvatar(
  messages: MessageItem[],
  index: number,
): boolean {
  const next = messages[index + 1];
  if (!next) return true;
  return !isSameChatSender(messages[index].senderId, next.senderId);
}

export function shouldShowSenderLabel(
  messages: MessageItem[],
  index: number,
): boolean {
  if (index === 0) return true;
  return !isSameChatSender(
    messages[index - 1].senderId,
    messages[index].senderId,
  );
}

export function isGroupedWithPrevious(
  messages: MessageItem[],
  index: number,
): boolean {
  if (index === 0) return false;
  return isSameChatSender(
    messages[index - 1].senderId,
    messages[index].senderId,
  );
}
