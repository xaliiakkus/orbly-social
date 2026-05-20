import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApi, useOrblyQueryClient } from "../context";
import { applyPostRepostToCache } from "../realtime/cache";

export function usePostRepost(
  targetPostId: string,
  initialReposted = false,
  initialCount = 0,
  initialMyRepostId?: string | null,
) {
  const api = useApi();
  const qc = useOrblyQueryClient();
  const busyRef = useRef(false);
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);
  const [myRepostId, setMyRepostId] = useState(initialMyRepostId ?? null);

  useEffect(() => {
    busyRef.current = false;
    setReposted(initialReposted);
    setCount(initialCount);
    setMyRepostId(initialMyRepostId ?? null);
  }, [targetPostId]);

  useEffect(() => {
    if (busyRef.current) return;
    setReposted(initialReposted);
    setMyRepostId(initialMyRepostId ?? null);
  }, [initialReposted, initialMyRepostId, targetPostId]);

  useEffect(() => {
    if (busyRef.current) return;
    setCount(initialCount);
  }, [initialCount, targetPostId]);

  const repostMutation = useMutation({
    mutationFn: () => api.posts.repost(targetPostId),
    onSuccess: (data) => {
      const nextCount = data.post?.stats?.repostCount ?? count + 1;
      applyPostRepostToCache(qc, targetPostId, {
        repostedByMe: true,
        myRepostId: data.post?.id ?? null,
        repostCount: nextCount,
      });
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["profile-posts"] });
    },
  });

  const unrepostMutation = useMutation({
    mutationFn: () => api.posts.unrepost(targetPostId),
    onSuccess: (data) => {
      applyPostRepostToCache(qc, targetPostId, {
        repostedByMe: false,
        myRepostId: null,
        repostCount: data.repostCount,
      });
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["profile-posts"] });
    },
  });

  const toggle = useCallback(async () => {
    if (busyRef.current || repostMutation.isPending || unrepostMutation.isPending) {
      return;
    }

    const next = !reposted;
    busyRef.current = true;
    setReposted(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (!next) setMyRepostId(null);

    try {
      if (next) {
        const res = await repostMutation.mutateAsync();
        if (res.post?.id) setMyRepostId(res.post.id);
      } else {
        await unrepostMutation.mutateAsync();
      }
    } catch {
      setReposted(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      if (next) setMyRepostId(initialMyRepostId ?? null);
    } finally {
      busyRef.current = false;
    }
  }, [
    reposted,
    repostMutation,
    unrepostMutation,
    targetPostId,
    initialMyRepostId,
    count,
  ]);

  return {
    reposted,
    count,
    myRepostId,
    toggle,
    isPending: repostMutation.isPending || unrepostMutation.isPending,
  };
}

export function useQuoteRepost() {
  const api = useApi();
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: {
      postId: string;
      content: string;
    }) => api.posts.repost(postId, content.trim()),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["profile-posts"] });
      void qc.invalidateQueries({ queryKey: ["post", vars.postId] });
    },
  });
}
