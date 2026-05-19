"use client";

import type { LiveChannelPublic } from "@orbly/api-client";
import { useLiveList } from "@orbly/features";
import { Mic, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { StartSpaceModal } from "@/components/live/start-space-modal";
import { Avatar } from "@/components/ui/avatar";

export function LiveSpacesSidebar() {
  const { data, isLoading } = useLiveList();
  const [spaceOpen, setSpaceOpen] = useState(false);
  const liveAvailable = data?.configured === true;

  const spaces = useMemo(
    () => (data?.data ?? []).filter((ch) => ch.kind === "space" && ch.status === "live"),
    [data?.data],
  );

  return (
    <>
      <div className="rounded-2xl bg-bg-secondary/80 border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
          <h2 className="text-xl font-extrabold">Sohbet kanalları</h2>
          {liveAvailable && (
            <button
              type="button"
              onClick={() => setSpaceOpen(true)}
              className="text-[13px] font-bold text-accent hover:underline shrink-0"
            >
              + Oda aç
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="px-4 py-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-bg-hover shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 rounded bg-bg-hover" />
                  <div className="h-3 w-1/2 rounded bg-bg-hover" />
                </div>
              </div>
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="px-4 pb-5 pt-2">
            <p className="text-text-secondary text-[15px] leading-relaxed">
              Şu an açık sesli oda yok. İlk sohbeti sen başlat.
            </p>
            {liveAvailable && (
              <button
                type="button"
                onClick={() => setSpaceOpen(true)}
                className="mt-3 inline-flex items-center gap-2 text-accent font-bold text-[15px] hover:underline"
              >
                <Users className="h-4 w-4" />
                Sohbet odası aç
              </button>
            )}
          </div>
        ) : (
          <ul>
            {spaces.map((ch) => (
              <SpaceRow key={ch.id} channel={ch} />
            ))}
          </ul>
        )}

        {spaces.length > 0 && (
          <Link
            href="/live"
            className="block px-4 py-3 text-accent text-[15px] font-semibold hover:bg-bg-hover transition-colors border-t border-border/60"
          >
            Tümünü gör
          </Link>
        )}
      </div>

      <StartSpaceModal
        open={spaceOpen}
        onClose={() => setSpaceOpen(false)}
        liveAvailable={liveAvailable}
      />
    </>
  );
}

function SpaceRow({ channel }: { channel: LiveChannelPublic }) {
  const host = channel.host;
  const listeners = channel.listenerCount ?? 0;
  const speakers = channel.speakerCount ?? 1;

  return (
    <li>
      <Link
        href={`/live/${channel.id}`}
        className="flex gap-3 px-4 py-3 hover:bg-bg-hover transition-colors"
      >
        <div className="relative shrink-0">
          <Avatar
            src={host?.avatarUrl}
            name={host?.displayName ?? host?.username ?? "?"}
            size="md"
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent border-2 border-bg-secondary"
            aria-hidden
          >
            <Mic className="h-2.5 w-2.5 text-white" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[15px] truncate leading-snug">{channel.title}</p>
          <p className="text-text-secondary text-[13px] truncate">
            {host?.displayName ?? host?.username ?? "Host"}
          </p>
          <p className="text-text-secondary text-[13px] mt-0.5">
            <span className="text-accent font-semibold">CANLI</span>
            {" · "}
            {listeners} dinleyici
            {speakers > 1 ? ` · ${speakers} konuşmacı` : ""}
          </p>
        </div>
      </Link>
    </li>
  );
}
