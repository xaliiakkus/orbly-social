import type { PostPublic } from "@orbly/types";

/** Rewet/alıntı hedefi — gömülü gönderi varsa onu, yoksa kartın kendisini. */
export function getRepostTargetPost(post: PostPublic): PostPublic {
  return post.repostOf ?? post;
}

export function getRepostTargetId(post: PostPublic): string {
  return getRepostTargetPost(post).id;
}

export function getRepostDisplayCount(post: PostPublic): number {
  const target = getRepostTargetPost(post);
  return target.stats.repostCount;
}
