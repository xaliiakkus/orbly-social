"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { useReplyCompose } from "@/components/post/reply-compose-context";
import { PageHeader } from "@/components/layout/page-header";
import { PostThread } from "@/components/post/post-thread";
import { api } from "@/lib/api";

function PostDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const replyTo = searchParams.get("replyTo");
  const router = useRouter();
  const qc = useQueryClient();
  const { openReply } = useReplyCompose();
  const openedReplyTo = useRef<string | null>(null);

  const post = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.posts.get(id),
    enabled: !!id,
  });

  const replies = useQuery({
    queryKey: ["replies", id],
    queryFn: () => api.posts.replies(id),
    enabled: !!id,
  });

  const refreshThread = () => {
    void qc.invalidateQueries({ queryKey: ["post", id] });
    void qc.invalidateQueries({ queryKey: ["replies", id] });
    void qc.invalidateQueries({ queryKey: ["feed"] });
  };

  const root = post.data?.post;
  const replyList = replies.data?.data ?? [];

  useEffect(() => {
    if (!replyTo || !root) return;
    if (openedReplyTo.current === replyTo) return;

    const target =
      replyTo === root.id ? root : replyList.find((r) => r.id === replyTo);
    if (!target) return;

    openedReplyTo.current = replyTo;
    openReply(target);
    router.replace(`/post/${id}`, { scroll: false });
  }, [replyTo, root, replyList, id, openReply, router]);

  return (
    <>
      <PageHeader title="Gönderi" />
      {root ? (
        <PostThread rootPost={root} replies={replyList} onRefresh={refreshThread} />
      ) : null}
    </>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense fallback={<PageHeader title="Gönderi" />}>
      <PostDetailContent />
    </Suspense>
  );
}
