"use client";

import { formatUserError } from "@orbly/api-client";
import { useFeed, type FeedMode } from "@orbly/features";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import type { PostPublic } from "@orbly/types";
import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

export function FeedList({
  mode,
  onNewPosts,
}: {
  mode: FeedMode;
  onNewPosts?: () => void;
}) {
  const loader = useRef<HTMLDivElement>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const query = useFeed(mode, { enabled: !!accessToken });
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.accessToken || !onNewPosts) return;
    const s = getSocket(session.accessToken);
    const handler = () => onNewPosts();
    s.on("feed:new", handler);
    return () => {
      s.off("feed:new", handler);
    };
  }, [session?.accessToken, onNewPosts]);

  useEffect(() => {
    const el = loader.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [query]);

  const posts: PostPublic[] = query.data?.pages.flatMap((p) => p.data) ?? [];

  if (query.isLoading || (!accessToken && query.fetchStatus !== "idle")) {
    return <FeedSkeleton />;
  }
  if (query.isError) {
    const detail = formatUserError(query.error);
    const offline =
      detail.includes("Bağlantı kurulamadı") || detail.includes("ulaşılamıyor");

    return (
      <div className="px-6 py-14 flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-full bg-bg-secondary border border-border flex items-center justify-center mb-4">
          {offline ? (
            <WifiOff className="h-7 w-7 text-text-secondary" />
          ) : (
            <AlertCircle className="h-7 w-7 text-like" />
          )}
        </div>
        <p className="text-lg font-bold">Akış yüklenemedi</p>
        <p className="text-text-secondary text-[15px] mt-2 max-w-sm leading-relaxed">
          {offline ? "Sunucuya bağlanılamadı. İnternetini kontrol edip tekrar dene." : detail}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5 gap-2"
          onClick={() => void query.refetch()}
        >
          <RefreshCw className="h-4 w-4" />
          Tekrar dene
        </Button>
      </div>
    );
  }
  if (!posts.length) {
    return (
      <div className="px-8 py-20 text-center border-b border-border">
        <p className="text-xl font-bold">Henüz gönderi yok</p>
        <p className="text-text-secondary mt-2 text-[15px] max-w-sm mx-auto leading-relaxed">
          {mode === "following"
            ? "Takip ettiğin kişiler paylaşınca burada görünür."
            : "Platformdaki paylaşımlar burada görünür. İlk gönderiyi sen atabilirsin."}
        </p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onRefresh={() => void query.refetch()} />
      ))}
      <div ref={loader} className="h-12" />
      {query.isFetchingNextPage && (
        <p className="py-6 text-center text-text-secondary text-sm">Daha fazla yükleniyor…</p>
      )}
    </>
  );
}
