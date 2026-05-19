"use client";

import type { LiveChannelPublic } from "@orbly/api-client";
import { useLiveList } from "@orbly/features";
import Link from "next/link";
import { useMemo } from "react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

function WaveBars({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5 h-4", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-white/90 animate-pulse"
          style={{
            height: `${8 + (i % 2) * 6}px`,
            animationDelay: `${i * 120}ms`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </span>
  );
}

function SpacePill({ channel }: { channel: LiveChannelPublic }) {
  const host = channel.host;
  const listeners = channel.listenerCount ?? 0;
  const speakerUsers = channel.speakers
    ?.slice(0, 3)
    .map((s) => s.user)
    .filter((u): u is NonNullable<typeof u> => !!u);
  const faces = speakerUsers?.length ? speakerUsers : host ? [host] : [];

  return (
    <Link
      href={`/live/${channel.id}`}
      className={cn(
        "flex min-w-[min(100%,280px)] shrink-0 items-center gap-2.5 rounded-full px-3 py-2",
        "bg-gradient-to-r from-orbit/90 via-accent to-accent/80",
        "text-white shadow-md shadow-orbit/20 hover:opacity-95 transition-opacity",
      )}
    >
      <WaveBars />
      <span className="flex -space-x-2 shrink-0">
        {faces.map((u, i) => (
          <span
            key={u.id}
            className="ring-2 ring-accent/80 rounded-full"
            style={{ zIndex: 3 - i }}
          >
            <Avatar
              src={u.avatarUrl}
              name={u.displayName ?? u.username}
              size="sm"
              className="h-7 w-7"
            />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-bold truncate leading-tight">
        {listeners > 0 && <span className="opacity-90">+{listeners} · </span>}
        {channel.title}
      </span>
      <WaveBars className="opacity-80" />
    </Link>
  );
}

/** X Spaces tarzı yatay canlı oda şeridi — sekmelerin hemen altında */
export function MobileSpacesBanner() {
  const { data, isLoading } = useLiveList();

  const spaces = useMemo(
    () => (data?.data ?? []).filter((ch) => ch.kind === "space" && ch.status === "live"),
    [data?.data],
  );

  if (isLoading || spaces.length === 0) return null;

  return (
    <div className="lg:hidden border-b border-border bg-bg-primary px-3 py-2.5 overflow-x-auto scrollbar-hide flex gap-2">
      {spaces.map((ch) => (
        <SpacePill key={ch.id} channel={ch} />
      ))}
    </div>
  );
}
