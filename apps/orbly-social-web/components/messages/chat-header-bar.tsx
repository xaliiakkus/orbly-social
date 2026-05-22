"use client";

import { BadgeCheck, ChevronLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import type { UserPublic } from "@orbly/types";

export function ChatHeaderBar({
  participant,
  backHref = "/messages",
}: {
  participant: UserPublic | null;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-primary/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Link
          href={backHref}
          className="p-2 -ml-1 rounded-full hover:bg-bg-hover text-text-primary shrink-0 md:hidden"
          aria-label="Mesajlara dön"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        {participant ? (
          <Link
            href={`/profile/${participant.username}`}
            className="flex items-center gap-3 min-w-0 flex-1 group"
          >
            <Avatar
              src={participant.avatarUrl}
              name={participant.displayName}
              size="md"
              className="h-11 w-11 ring-2 ring-accent/20"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-bold text-[16px] truncate group-hover:underline">
                  {participant.displayName}
                </p>
                {participant.verified ? (
                  <BadgeCheck className="h-4 w-4 text-accent shrink-0 fill-accent/20" />
                ) : null}
              </div>
              <p className="text-[13px] text-text-secondary truncate">
                @{participant.username}
              </p>
            </div>
          </Link>
        ) : (
          <p className="font-bold text-[16px]">Sohbet</p>
        )}

        {participant ? (
          <Link
            href={`/profile/${participant.username}`}
            className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-accent px-3 py-1.5 rounded-full border border-accent/30 hover:bg-accent/10 shrink-0"
          >
            Profil
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}
