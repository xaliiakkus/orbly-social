"use client";

import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import { Hash, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { ExploreFeaturedCard } from "@/components/explore/explore-featured-card";
import { ExploreHeader } from "@/components/explore/explore-header";
import {
  ExploreScrollTabs,
  type ExploreTabId,
} from "@/components/explore/explore-scroll-tabs";
import { ExplorePostsFeed } from "@/components/explore/explore-posts-feed";
import { ExploreTrendRow, trendMetaLine } from "@/components/explore/explore-trend-row";
import { MobileMenuDrawer } from "@/components/layout/mobile-menu-drawer";
import { PostCard } from "@/components/post/post-card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { api } from "@/lib/api";

function normalizeTag(raw: string | null): string | null {
  if (!raw) return null;
  const t = decodeURIComponent(raw).trim().replace(/^#/, "").toLowerCase();
  return t.length > 0 ? t : null;
}

export function ExploreContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tag = useMemo(() => normalizeTag(params.get("tag")), [params]);

  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [tab, setTab] = useState<ExploreTabId>("for-you");
  const [menuOpen, setMenuOpen] = useState(false);

  const runSearch = useCallback(() => {
    const term = q.trim();
    if (term.length < 2) return;
    setSubmitted(term);
    if (tag) router.replace("/explore");
  }, [q, tag, router]);

  const clearSearch = useCallback(() => {
    setQ("");
    setSubmitted("");
  }, []);

  const search = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => api.search.query(submitted),
    enabled: submitted.length >= 2 && !tag,
  });

  const hashtag = useQuery({
    queryKey: ["hashtag", tag],
    queryFn: () => api.feed.hashtag(tag!),
    enabled: !!tag,
  });

  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.feed.trending(),
    enabled: !tag && !submitted,
  });

  const trendingItems = useMemo(() => trending.data?.data ?? [], [trending.data]);

  const header = (
    <ExploreHeader
      query={q}
      onChangeQuery={setQ}
      onSubmitSearch={runSearch}
      onOpenMenu={() => setMenuOpen(true)}
      searchMode={submitted.length >= 2 && !tag}
      onBack={clearSearch}
    />
  );

  if (tag) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-border">
          <ExploreHeader
            query={`#${tag}`}
            onChangeQuery={() => {}}
            onSubmitSearch={() => {}}
            searchMode
            onBack={() => router.push("/explore")}
          />
          <div className="px-4 py-2 border-t border-border flex items-center gap-2 bg-orbit/10">
            <Hash className="h-5 w-5 text-orbit shrink-0" />
            <p className="font-bold text-xl truncate">#{tag}</p>
          </div>
        </div>
        {hashtag.isLoading && <FeedSkeleton rows={4} />}
        {hashtag.isError && (
          <EmptyState
            icon={Hash}
            title="Etiket yüklenemedi"
            description={formatUserError(hashtag.error)}
            action={
              <button
                type="button"
                className="text-accent font-semibold hover:underline"
                onClick={() => void hashtag.refetch()}
              >
                Tekrar dene
              </button>
            }
          />
        )}
        {hashtag.data?.data.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hashtag.data && !hashtag.data.data.length && (
          <EmptyState
            icon={Hash}
            title="Bu etikette gönderi yok"
            description="Gönderinde bu etiketi kullan veya başka bir trend seç."
          />
        )}
      </div>
    );
  }

  if (submitted.length >= 2) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-border">
          {header}
        </div>
        {search.isLoading && <FeedSkeleton rows={4} />}
        {search.isError && (
          <EmptyState
            icon={Search}
            title="Arama başarısız"
            description={formatUserError(search.error)}
            action={
              <button
                type="button"
                className="text-accent font-semibold hover:underline"
                onClick={() => void search.refetch()}
              >
                Tekrar dene
              </button>
            }
          />
        )}
        {search.data && (
          <div className="divide-y divide-border">
            {search.data.users.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${u.username}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors"
              >
                <Avatar src={u.avatarUrl} name={u.displayName} />
                <div>
                  <p className="font-bold">{u.displayName}</p>
                  <p className="text-text-secondary">@{u.username}</p>
                </div>
              </Link>
            ))}
            {search.data.orbits.map((o) => (
              <Link
                key={o.id}
                href={`/orbits/${o.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors"
              >
                <div className="h-11 w-11 rounded-xl bg-orbit/20 flex items-center justify-center text-orbit font-bold">
                  {o.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{o.name}</p>
                  <p className="text-text-secondary text-[14px]">@{o.slug}</p>
                </div>
              </Link>
            ))}
            {search.data.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {!search.data.users.length &&
              !search.data.orbits.length &&
              !search.data.posts.length && (
                <EmptyState
                  icon={Search}
                  title="Sonuç bulunamadı"
                  description={`"${submitted}" için eşleşme yok.`}
                />
              )}
          </div>
        )}
        <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    );
  }

  const placeholderLabel =
    tab === "news" ? "Haberler" : tab === "sports" ? "Spor" : tab === "fun" ? "Eğlence" : "";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-border">
        {header}
        <ExploreScrollTabs active={tab} onChange={setTab} />
      </div>

      {tab === "for-you" || tab === "trending" ? (
        <>
          {tab === "for-you" ? <ExploreFeaturedCard /> : null}
          {trending.isLoading ? <FeedSkeleton rows={3} /> : null}
          {trending.isError ? (
            <EmptyState
              icon={TrendingUp}
              title="Gündem yüklenemedi"
              description={formatUserError(trending.error)}
              action={
                <button
                  type="button"
                  className="text-accent font-semibold hover:underline"
                  onClick={() => void trending.refetch()}
                >
                  Tekrar dene
                </button>
              }
            />
          ) : null}
          {!trending.isLoading &&
            !trending.isError &&
            trendingItems.map((item) => (
              <ExploreTrendRow
                key={item.tag}
                title={item.tag.startsWith("#") ? item.tag : `#${item.tag}`}
                meta={trendMetaLine(item.count)}
                href={`/explore?tag=${encodeURIComponent(item.tag)}`}
              />
            ))}
          <ExplorePostsFeed tab={tab === "trending" ? "trending" : "for-you"} />
        </>
      ) : (
        <EmptyState
          icon={Search}
          title={`${placeholderLabel} yakında`}
          description="Bu kategori için özel gündem listesi üzerinde çalışıyoruz."
        />
      )}

      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
