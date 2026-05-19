"use client";

import { formatUserError } from "@orbly/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FileText, Heart, ImageIcon, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { PostCard } from "@/components/post/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { ProfileBroadcasts } from "@/components/profile/profile-broadcasts";
import type { ProfileTab } from "@/components/profile/profile-tabs";
import { api } from "@/lib/api";
import type { PostPublic } from "@orbly/types";

const comingSoon: Record<string, { title: string; description: string; icon: typeof FileText }> = {
  replies: {
    title: "Yanıtlar yakında",
    description: "Kullanıcının yanıtları burada listelenecek.",
    icon: MessageCircle,
  },
  highlights: {
    title: "Öne çıkanlar yakında",
    description: "Öne çıkan gönderiler burada görünecek.",
    icon: Sparkles,
  },
  articles: {
    title: "Makaleler yakında",
    description: "Uzun form içerikler burada yayınlanacak.",
    icon: FileText,
  },
  likes: {
    title: "Beğeniler yakında",
    description: "Beğenilen gönderiler burada listelenecek.",
    icon: Heart,
  },
};

export function ProfilePosts({
  username,
  tab,
  isSelf,
}: {
  username: string;
  tab: ProfileTab;
  isSelf?: boolean;
}) {
  const loader = useRef<HTMLDivElement>(null);
  const isFeedTab = tab === "posts" || tab === "media";

  const query = useInfiniteQuery({
    queryKey: ["profile-posts", username],
    queryFn: ({ pageParam }) => api.users.posts(username, pageParam),
    enabled: !!username && isFeedTab,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  });

  useEffect(() => {
    if (!isFeedTab) return;
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
  }, [query, isFeedTab]);

  const posts = useMemo(() => {
    const allPosts: PostPublic[] = query.data?.pages.flatMap((p) => p.data) ?? [];
    if (tab === "media") {
      return allPosts.filter((p) => p.mediaUrls.length > 0);
    }
    return allPosts;
  }, [query.data?.pages, tab]);

  if (tab === "broadcasts") {
    return <ProfileBroadcasts username={username} />;
  }

  if (!isFeedTab) {
    const info = comingSoon[tab];
    return (
      <EmptyState
        icon={info.icon}
        title={info.title}
        description={info.description}
        className="py-16"
      />
    );
  }

  if (query.isLoading) {
    return <FeedSkeleton rows={5} />;
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={FileText}
        title="Gönderiler yüklenemedi"
        description={formatUserError(query.error)}
        action={
          <button
            type="button"
            className="text-accent font-semibold hover:underline"
            onClick={() => void query.refetch()}
          >
            Tekrar dene
          </button>
        }
      />
    );
  }

  if (!posts.length) {
    return (
      <EmptyState
        icon={tab === "media" ? ImageIcon : FileText}
        title={tab === "media" ? "Medya yok" : "Henüz gönderi yok"}
        description={
          tab === "media"
            ? "Bu kullanıcı henüz fotoğraf veya video paylaşmadı."
            : isSelf
              ? "İlk gönderini ana sayfadan paylaş."
              : "Bu kullanıcı henüz bir şey paylaşmadı."
        }
        className="py-16"
      />
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onRefresh={() => void query.refetch()} />
      ))}
      <div ref={loader} className="h-8" />
      {query.isFetchingNextPage && (
        <p className="py-4 text-center text-text-secondary text-sm">Daha fazla yükleniyor…</p>
      )}
    </>
  );
}
