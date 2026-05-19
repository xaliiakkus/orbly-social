"use client";

import { formatUserError } from "@orbly/api-client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Hash, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { PostCard } from "@/components/post/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

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

  const runSearch = useCallback(() => {
    const term = q.trim();
    if (term.length < 2) return;
    setSubmitted(term);
    if (tag) router.replace("/explore");
  }, [q, tag, router]);

  const clearSearch = () => {
    setQ("");
    setSubmitted("");
  };

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

  const orbits = useQuery({
    queryKey: ["orbits"],
    queryFn: () => api.orbits.list(),
    enabled: !tag && !submitted,
  });

  const showTrending = !tag && !submitted;
  const showSearch = !tag && submitted.length >= 2;
  const showHashtag = !!tag;

  return (
    <>
      <PageHeader
        title={showHashtag ? `#${tag}` : "Keşfet"}
        subtitle={
          showHashtag
            ? "Etiket gönderileri"
            : showSearch
              ? `"${submitted}" araması`
              : "Ara, trendleri keşfet"
        }
        action={
          (showHashtag || showSearch) ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => {
                clearSearch();
                router.push("/explore");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
          ) : undefined
        }
      />

      <form
        className="p-4 border-b border-border"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="flex gap-2">
          <label className="relative block flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kullanıcı, gönderi veya orbit ara (min. 2 karakter)"
              className="w-full bg-bg-secondary rounded-full pl-11 pr-4 py-3 text-[15px] outline-none border border-transparent focus:border-accent/50 transition-colors"
            />
          </label>
          <Button type="submit" variant="accent" size="md" disabled={q.trim().length < 2}>
            Ara
          </Button>
        </div>
        {submitted && !tag && (
          <button
            type="button"
            className="mt-2 text-[13px] text-accent hover:underline"
            onClick={clearSearch}
          >
            Aramayı temizle
          </button>
        )}
      </form>

      {showHashtag && (
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-orbit/10">
          <Hash className="h-5 w-5 text-orbit shrink-0" />
          <p className="font-bold text-xl truncate">#{tag}</p>
        </div>
      )}

      {showHashtag && hashtag.isLoading && <FeedSkeleton rows={4} />}
      {showHashtag && hashtag.isError && (
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
      {showHashtag && hashtag.data && (
        <>
          {hashtag.data.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {!hashtag.data.data.length && (
            <EmptyState
              icon={Hash}
              title="Bu etikette gönderi yok"
              description="Gönderinde bu etiketi kullan veya başka bir trend seç."
            />
          )}
        </>
      )}

      {showSearch && search.isLoading && <FeedSkeleton rows={4} />}
      {showSearch && search.isError && (
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
      {showSearch && search.data && (
        <div className="divide-y divide-border">
          {search.data.users.length > 0 && (
            <section>
              <h2 className="px-4 py-3 font-bold text-[13px] text-text-secondary uppercase tracking-wide">
                Kişiler
              </h2>
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
            </section>
          )}
          {search.data.orbits.length > 0 && (
            <section>
              <h2 className="px-4 py-3 font-bold text-[13px] text-text-secondary uppercase tracking-wide">
                Orbit&apos;ler
              </h2>
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
            </section>
          )}
          {search.data.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {!search.data.users.length &&
            !search.data.orbits.length &&
            !search.data.posts.length && (
              <EmptyState
                icon={Search}
                title="Sonuç bulunamadı"
                description={`"${submitted}" için eşleşme yok. Farklı bir kelime dene.`}
              />
            )}
        </div>
      )}

      {showTrending && (
        <>
          <h2 className="px-4 py-3 font-bold text-[15px] flex items-center gap-2 border-b border-border">
            <TrendingUp className="h-5 w-5 text-accent" />
            Gündemde
          </h2>
          {trending.isLoading && <FeedSkeleton rows={3} />}
          {trending.isError && (
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
          )}
          {!trending.isLoading && !trending.isError && (
            <>
              {trending.data?.data.map((item, i) => (
                <Link
                  key={item.tag}
                  href={`/explore?tag=${encodeURIComponent(item.tag)}`}
                  className="block px-4 py-4 hover:bg-bg-hover border-b border-border transition-colors"
                >
                  <p className="text-text-secondary text-[13px]">{i + 1} · Trend</p>
                  <p className="font-bold text-[17px]">#{item.tag}</p>
                  <p className="text-text-secondary text-[13px]">{item.count} gönderi</p>
                </Link>
              ))}
              {!trending.data?.data.length && (
                <EmptyState
                  icon={TrendingUp}
                  title="Henüz trend yok"
                  description="Hashtag içeren gönderiler paylaşıldıkça gündem dolacak."
                />
              )}
            </>
          )}

          <h2 className="px-4 py-3 font-bold text-[15px] flex items-center gap-2 border-b border-t border-border mt-2">
            <Sparkles className="h-5 w-5 text-orbit" />
            Orbit&apos;ler
          </h2>
          {orbits.isLoading && <FeedSkeleton rows={3} />}
          {orbits.data?.data.map((o) => (
            <Link
              key={o.id}
              href={`/orbits/${o.slug}`}
              className={cn(
                "flex items-center gap-3 px-4 py-4 border-b border-border hover:bg-bg-hover transition-colors",
              )}
            >
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orbit/30 to-accent/20 flex items-center justify-center text-orbit font-bold text-lg shrink-0">
                {o.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{o.name}</p>
                <p className="text-text-secondary text-[14px]">@{o.slug}</p>
              </div>
              <span className="flex items-center gap-1 text-text-secondary text-[13px] shrink-0">
                <Users className="h-4 w-4" />
                {o.stats.memberCount}
              </span>
            </Link>
          ))}
        </>
      )}
    </>
  );
}
