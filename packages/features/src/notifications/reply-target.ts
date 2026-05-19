import type { NotificationItem, PostPublic, UserPublic } from "@orbly/types";

/** Yanıt modalı için minimal gönderi (bildirimdeki yanıt gönderisi) */
export function notificationReplyTarget(n: NotificationItem): PostPublic | null {
  if (n.type !== "reply" || !n.actor || !n.postPreview) return null;
  const stats = n.postPreview.stats ?? {
    likeCount: 0,
    replyCount: 0,
    repostCount: 0,
    viewCount: 0,
  };
  return {
    id: n.postPreview.id,
    content: n.postPreview.content,
    mediaUrls: n.postPreview.mediaUrl ? [n.postPreview.mediaUrl] : [],
    author: n.actor,
    hashtags: [],
    stats: {
      ...stats,
      bookmarkCount: 0,
    },
    likedByMe: n.postPreview.likedByMe ?? false,
    bookmarkedByMe: false,
    createdAt: n.createdAt,
    updatedAt: n.createdAt,
  };
}

export function getReplyingToLabel(
  preview: NonNullable<NotificationItem["postPreview"]>,
): string | null {
  if (!preview.replyToId) return null;
  if (preview.replyToUsername) return preview.replyToUsername;
  return null;
}

export function formatReplyingToLine(usernames: string[]): string | null {
  if (usernames.length === 0) return null;
  if (usernames.length === 1) return `@${usernames[0]}`;
  if (usernames.length === 2) return `@${usernames[0]} ve @${usernames[1]}`;
  return `@${usernames[0]} ve ${usernames.length - 1} kişi daha`;
}
