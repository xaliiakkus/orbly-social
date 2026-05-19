import {
  buildThreadPostLookup,
  getReplyingToUsername,
  sortThreadReplies,
} from "@orbly/features";
import type { PostPublic } from "@orbly/types";
import { useMemo } from "react";

import { PostCard } from "@/components/PostCard";
import { useReplyCompose } from "@/lib/reply-compose-context";

export function PostThread({
  rootPost,
  replies,
  onRefresh,
}: {
  rootPost: PostPublic;
  replies: PostPublic[];
  onRefresh?: () => void;
}) {
  const { openReply, targetPost } = useReplyCompose();
  const lookup = useMemo(
    () => buildThreadPostLookup(rootPost, replies),
    [rootPost, replies],
  );
  const sortedReplies = useMemo(() => sortThreadReplies(replies), [replies]);

  return (
    <>
      <PostCard
        post={rootPost}
        threadRootId={rootPost.id}
        onReply={() => openReply(rootPost)}
        onRefresh={onRefresh}
        highlightReply={targetPost?.id === rootPost.id}
      />
      {sortedReplies.map((reply) => (
        <PostCard
          key={reply.id}
          post={reply}
          threadRootId={rootPost.id}
          replyingToUsername={getReplyingToUsername(reply, rootPost.id, lookup)}
          onReply={() => openReply(reply)}
          onRefresh={onRefresh}
          highlightReply={targetPost?.id === reply.id}
        />
      ))}
    </>
  );
}
