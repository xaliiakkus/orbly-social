"use client";

import { formatUserError } from "@orbly/api-client";
import { useExploreFeed, type ExploreFeedTab } from "@orbly/features";
import { useEffect, useRef } from "react";

import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { TrendingUp } from "lucide-react";

export function ExplorePostsFeed({ tab }: { tab: ExploreFeedTab }) {
  const query = useExploreFeed(tab);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const posts = query.data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !query.hasNextPage || query.isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void query.fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [query]);

  if (query.isLoading) {
    return <FeedSkeleton rows={4} />;
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Gönderiler yüklenemedi"
        description={formatUserError(query.error)}
        action={
          <Button variant="accent" size="sm" onClick={() => void query.refetch()}>
            Tekrar dene
          </Button>
        }
      />
    );
  }

  if (!posts.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Henüz keşfedilecek gönderi yok"
        description="Etkileşim alan gönderiler otomatik olarak burada görünür."
      />
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onRefresh={() => void query.refetch()}
        />
      ))}
      {query.isFetchingNextPage ? <FeedSkeleton rows={2} /> : null}
      <div ref={sentinelRef} className="h-4" aria-hidden />
    </div>
  );
}
