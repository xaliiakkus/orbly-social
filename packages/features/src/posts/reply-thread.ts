import type { PostPublic } from "@orbly/types";
import { useEffect, useMemo, useState } from "react";

export type ReplyTarget = {
  postId: string;
  username: string;
  displayName: string;
};

export function getThreadRootId(post: PostPublic): string {
  return post.replyToId ?? post.id;
}

export function replyTargetFromPost(post: PostPublic): ReplyTarget {
  return {
    postId: post.id,
    username: post.author.username,
    displayName: post.author.displayName,
  };
}

/** Konuşmadaki tüm gönderiler (kök + yanıtlar) — ebeveyn çözümlemesi için. */
export function buildThreadPostLookup(
  rootPost: PostPublic,
  replies: PostPublic[],
): Map<string, PostPublic> {
  const lookup = new Map<string, PostPublic>();
  lookup.set(rootPost.id, rootPost);
  for (const reply of replies) {
    lookup.set(reply.id, reply);
  }
  return lookup;
}

/** X tarzı: yanıtlar kronolojik düz liste (iç içe ağaç yok). */
export function sortThreadReplies(replies: PostPublic[]): PostPublic[] {
  return [...replies].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Kök dışı bir gönderiye yanıtsa kart üstünde @kullanıcı gösterilir. */
export function getReplyingToUsername(
  post: PostPublic,
  threadRootId: string,
  lookup: Map<string, PostPublic>,
): string | null {
  if (!post.replyToId || post.replyToId === threadRootId) return null;
  const parent = lookup.get(post.replyToId);
  return parent?.author.username ?? null;
}

export function resolveReplyTarget(
  rootPost: PostPublic,
  replies: PostPublic[],
  replyToId?: string | null,
): ReplyTarget {
  const rootTarget = replyTargetFromPost(rootPost);
  if (!replyToId || replyToId === rootPost.id) return rootTarget;
  const found = replies.find((r) => r.id === replyToId);
  return found ? replyTargetFromPost(found) : rootTarget;
}

/** Gönderi detayı: ?replyTo= ile gelen hedef + yanıt ikonu seçimi. */
export function useThreadReplyTarget(
  rootPost: PostPublic | null | undefined,
  replies: PostPublic[],
  initialReplyToId?: string | null,
) {
  const rootTarget = useMemo(
    () => (rootPost ? replyTargetFromPost(rootPost) : null),
    [rootPost],
  );
  const initialTarget = useMemo(() => {
    if (!rootPost || !rootTarget) return null;
    return resolveReplyTarget(rootPost, replies, initialReplyToId);
  }, [initialReplyToId, replies, rootPost, rootTarget]);

  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(initialTarget);

  useEffect(() => {
    if (initialTarget) setReplyTarget(initialTarget);
  }, [initialTarget]);

  return { replyTarget, setReplyTarget, rootTarget };
}
