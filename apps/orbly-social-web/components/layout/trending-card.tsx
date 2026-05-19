"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";

export function TrendingCard({ className }: { className?: string }) {
  const { data: trending } = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.feed.trending(),
  });

  const cardClass =
    className ??
    "rounded-2xl bg-bg-secondary/80 border border-border overflow-hidden";

  return (
    <div className={cardClass}>
      <h2 className="text-xl font-extrabold px-4 py-3">Gündemde</h2>
      {trending?.data.length ? (
        <div>
          {trending.data.map((item, i) => (
            <Link
              key={item.tag}
              href={`/explore?tag=${item.tag}`}
              className="block px-4 py-3 hover:bg-bg-hover transition-colors"
            >
              <p className="text-text-secondary text-[13px]">
                {i + 1} · Trend
              </p>
              <p className="font-bold text-[15px]">#{item.tag}</p>
              <p className="text-text-secondary text-[13px]">{item.count} gönderi</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-5 pt-1">
          <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-bg-primary/40 p-4">
            <Sparkles className="h-5 w-5 text-orbit shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[15px]">Henüz trend yok</p>
              <p className="text-text-secondary text-[13px] mt-1 leading-relaxed">
                İlk gönderileri paylaşınca gündem burada belirecek.
              </p>
              <Link
                href="/orbits"
                className="inline-block mt-2 text-accent text-[13px] font-semibold hover:underline"
              >
                Orbit&apos;lere göz at →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
