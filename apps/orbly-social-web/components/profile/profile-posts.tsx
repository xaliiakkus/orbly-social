"use client";

import { formatUserError } from "@orbly/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FileText, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { PostCard } from "@/components/post/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { MediaImage } from "@/components/ui/media-image";
import { ProfileBroadcasts } from "@/components/profile/profile-broadcasts";
import { ProfileOrbits } from "@/components/profile/profile-orbits";
import type { ProfileTab } from "@/components/profile/profile-tabs";
import { api } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import type { PostPublic } from "@orbly/types";

const comingSoon: Record<string, { title: string; description: string; icon: typeof FileText }> = {
  replies: {
    title: "Yanıtlar yakında",
    description: "Kullanıcının yanıtları burada listelenecek.",
    icon: MessageCircle,
  },
  likes: {
    title: "Beğeniler yakında",
    description: "Beğenilen gönderiler burada listelenecek.",
    icon: Heart,
  },
};

function ProfileTabEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-profile-fade-in">
      <p className="text-[17px] font-bold text-text-primary">{title}</p>
      {description ? (
        <p className="text-[15px] text-text-secondary mt-2 max-w-sm">{description}</p>
      ) : null}
    </div>
  );
}

function ProfileMediaGrid({ posts }: { posts: PostPublic[] }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 p-0.5 animate-profile-fade-in">
      {posts.map((post) => {
        const src = resolveMediaUrl(post.mediaUrls[0]);
        if (!src) return null;
        return (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="relative aspect-square bg-bg-secondary overflow-hidden hover:opacity-90 transition-opacity"
          >
            <MediaImage src={src} alt="" className="absolute inset-0 h-full w-full" sizes="33vw" />
          </Link>
        );
      })}
    </div>
  );
}

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

  if (tab === "orbits") {
    return <ProfileOrbits username={username} isSelf={isSelf} />;
  }

  if (!isFeedTab) {
    const info = comingSoon[tab];
    if (!info) return null;
    return (
      <ProfileTabEmpty title={info.title} description={info.description} />
    );
  }

  if (query.isLoading) {
    return <FeedSkeleton rows={tab === "media" ? 3 : 5} />;
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
    if (tab === "media") {
      return (
        <ProfileTabEmpty
          title="Medya yok"
          description={
            isSelf
              ? "Fotoğraf veya video içeren gönderilerin burada görünür."
              : "Bu kullanıcı henüz medya paylaşmadı."
          }
        />
      );
    }
    return (
      <ProfileTabEmpty
        title="Henüz gönderi yok"
        description={isSelf ? "İlk gönderini ana sayfadan paylaş." : undefined}
      />
    );
  }

  if (tab === "media") {
    return (
      <>
        <ProfileMediaGrid posts={posts} />
        <div ref={loader} className="h-8" />
        {query.isFetchingNextPage ? (
          <p className="py-4 text-center text-text-secondary text-sm">Daha fazla yükleniyor…</p>
        ) : null}
      </>
    );
  }

  return (
    <div className="animate-profile-fade-in">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onRefresh={() => void query.refetch()} />
      ))}
      <div ref={loader} className="h-8" />
      {query.isFetchingNextPage ? (
        <p className="py-4 text-center text-text-secondary text-sm">Daha fazla yükleniyor…</p>
      ) : null}
    </div>
  );
}
