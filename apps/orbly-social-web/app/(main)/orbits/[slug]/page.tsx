"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Users } from "lucide-react";
import { useParams } from "next/navigation";

import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";

export default function OrbitDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();

  const orbit = useQuery({
    queryKey: ["orbit", slug],
    queryFn: () => api.orbits.get(slug),
    enabled: !!slug,
  });

  const posts = useQuery({
    queryKey: ["orbit-posts", slug],
    queryFn: () => api.orbits.posts(slug),
    enabled: !!slug,
  });

  const joined = orbit.data?.isMember ?? false;

  const toggle = useMutation({
    mutationFn: () => (joined ? api.orbits.leave(slug) : api.orbits.join(slug)),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ["orbit", slug] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
      const me = await api.auth.me();
      useAuthStore.getState().setUser(me.user);
    },
  });

  const o = orbit.data?.orbit;

  if (orbit.isLoading) {
    return <FeedSkeleton rows={2} />;
  }

  if (!o) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Orbit bulunamadı"
        description="Bu topluluk mevcut değil veya kaldırılmış."
      />
    );
  }

  return (
    <>
      <div className="border-b border-border overflow-hidden">
        <div
          className={cn(
            "h-28 sm:h-32 bg-gradient-to-br from-orbit/50 via-accent/30 to-bg-secondary",
            "flex items-end px-4 pb-4",
          )}
        >
          <div
            className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center",
              "bg-bg-primary/90 border border-orbit/40 text-orbit font-extrabold text-2xl shadow-lg",
            )}
          >
            {o.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="px-4 pb-4 -mt-2">
          <h1 className="text-2xl font-extrabold">{o.name}</h1>
          <p className="text-text-secondary text-[15px]">@{o.slug}</p>
          {o.description && (
            <p className="mt-3 text-[15px] leading-relaxed text-text-primary/90">
              {o.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-text-secondary text-[14px]">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {o.stats.memberCount} üye
            </span>
            <span>{o.stats.postCount} gönderi</span>
          </div>
          <Button
            className="mt-4"
            variant={joined ? "outline" : "accent"}
            size="sm"
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
          >
            {joined ? "Orbit'ten ayrıl" : "Orbit'e katıl"}
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <p className="font-bold text-[15px]">Gönderiler</p>
      </div>

      {posts.isLoading && <FeedSkeleton rows={4} />}
      {posts.data?.data.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {!posts.isLoading && !posts.data?.data.length && (
        <EmptyState
          icon={Sparkles}
          title="Henüz gönderi yok"
          description={
            joined
              ? "Bu orbit'te ilk gönderiyi sen paylaş."
              : "Katılıp topluluğa katkı verebilirsin."
          }
        />
      )}
    </>
  );
}
