"use client";

import type { LiveChannelPublic } from "@orbly/api-client";
import { Mic, Radio, Users, Video } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export function LiveChannelCard({ channel }: { channel: LiveChannelPublic }) {
  const host = channel.host;

  return (
    <Link
      href={`/live/${channel.id}`}
      className="flex gap-3 p-4 border-b border-border hover:bg-bg-hover/50 transition-colors"
    >
      <div className="relative shrink-0">
        <Avatar src={host?.avatarUrl} name={host?.displayName ?? host?.username ?? "?"} size="lg" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-like border-2 border-bg-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold truncate">{channel.title}</p>
        <p className="text-text-secondary text-[15px] truncate">
          {host?.displayName ?? host?.username ?? "Yayıncı"}
        </p>
        <div className="flex items-center gap-3 mt-1 text-[13px] text-text-secondary">
          {channel.kind === "space" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-accent/15 text-accent">
              <Users className="h-3.5 w-3.5" /> Sohbet
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                channel.mode === "video" ? "bg-accent/15 text-accent" : "bg-bg-hover",
              )}
            >
              {channel.mode === "video" ? (
                <>
                  <Video className="h-3.5 w-3.5" /> Görüntülü
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" /> Sesli
                </>
              )}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {channel.listenerCount}
          </span>
          <span className="inline-flex items-center gap-1 text-like font-semibold">
            <Radio className="h-3.5 w-3.5" />
            CANLI
          </span>
        </div>
      </div>
    </Link>
  );
}
