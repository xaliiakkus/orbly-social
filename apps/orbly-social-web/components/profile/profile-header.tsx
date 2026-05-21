"use client";

import {
  BadgeCheck,
  Calendar,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ProfileMutualFollowers } from "@/components/profile/profile-mutual-followers";
import { ProfileOrbitPills } from "@/components/profile/profile-orbit-pills";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media-url";
import type { UserPublic } from "@orbly/types";

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} tarihinde katıldı`;
}

function formatWebsiteDisplay(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function websiteHref(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export function ProfileHeader({
  user,
  isSelf,
  isFollowing,
  isFollowedBy,
  followPending,
  onFollowToggle,
  onEditProfile,
  onMessage,
  canMessage,
  messagePending,
}: {
  user: UserPublic;
  isSelf: boolean;
  isFollowing: boolean;
  isFollowedBy?: boolean;
  onFollowToggle: () => void;
  followPending?: boolean;
  onEditProfile?: () => void;
  onMessage?: () => void;
  canMessage?: boolean;
  messagePending?: boolean;
}) {
  const [hoveringFollow, setHoveringFollow] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const banner = resolveMediaUrl(user.bannerUrl);

  const orbitsQuery = useQuery({
    queryKey: ["profile-orbits", user.username],
    queryFn: () => api.users.orbits(user.username),
    staleTime: 60_000,
  });

  const mutualQuery = useQuery({
    queryKey: ["profile-mutual-followers", user.username],
    queryFn: () => api.users.mutualFollowers(user.username, 3),
    enabled: !isSelf,
    staleTime: 60_000,
  });

  const copyProfileLink = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${user.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt("Profil bağlantısı", url);
    }
  };

  return (
    <header>
      <div className="relative h-48 overflow-hidden">
        {banner ? (
          <>
            <MediaImage src={banner} alt="" className="absolute inset-0 h-full w-full" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 gradient-banner">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full border border-accent/40 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full border border-orbit/40 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 relative">
        <div className="absolute -top-16 left-4 z-10">
          <div className="relative">
            <Avatar
              src={user.avatarUrl}
              name={user.displayName}
              size="xl"
              className="h-32 w-32 border-4 border-bg-primary text-4xl"
            />
            <span
              className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-repost border-2 border-bg-primary"
              aria-hidden
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 pb-3 min-h-[52px]">
          {linkCopied ? (
            <span className="text-[13px] text-accent mr-1" aria-live="polite">
              Kopyalandı
            </span>
          ) : null}
          <button
            type="button"
            className="btn-outline p-2 rounded-full"
            onClick={() => void copyProfileLink()}
            aria-label="Profili paylaş"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            className="btn-outline p-2 rounded-full"
            aria-label="Daha fazla"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
          {!isSelf && onMessage ? (
            <button
              type="button"
              className="btn-outline p-2 rounded-full"
              onClick={onMessage}
              disabled={!canMessage || messagePending}
              title={canMessage ? "Mesaj gönder" : "Mesaj için karşılıklı takip gerekir"}
              aria-label="Mesaj gönder"
            >
              <Mail className="h-[18px] w-[18px]" />
            </button>
          ) : null}
          {isSelf ? (
            <button type="button" className="btn-outline px-4 py-1.5 text-[15px]" onClick={onEditProfile}>
              Profili düzenle
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                "px-4 py-1.5 text-[15px] transition-all active:scale-95 disabled:opacity-50",
                isFollowing ? "btn-following" : "btn-follow",
              )}
              onClick={onFollowToggle}
              disabled={followPending}
              onMouseEnter={() => setHoveringFollow(true)}
              onMouseLeave={() => setHoveringFollow(false)}
            >
              {isFollowing
                ? hoveringFollow
                  ? "Takibi bırak"
                  : "Takip ediliyor"
                : "Takip et"}
            </button>
          )}
        </div>

        <div className="mt-12 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[23px] font-bold leading-tight">{user.displayName}</h2>
            {user.verified ? (
              <BadgeCheck className="h-[22px] w-[22px] text-accent shrink-0" aria-label="Doğrulanmış" />
            ) : null}
          </div>
          <p className="text-[15px] text-text-secondary mt-0.5">@{user.username}</p>

          {user.bio ? (
            <p className="text-[15px] text-text-primary mt-3 leading-snug whitespace-pre-wrap break-words">
              {user.bio}
            </p>
          ) : null}

          {(user.location || user.website || user.createdAt) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[14px] text-text-secondary">
              {user.location ? (
                <span className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.location}</span>
                </span>
              ) : null}
              {user.website ? (
                <a
                  href={websiteHref(user.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-accent hover:underline min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{formatWebsiteDisplay(user.website)}</span>
                </a>
              ) : null}
              {user.createdAt ? (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {formatJoinDate(user.createdAt)}
                </span>
              ) : null}
            </div>
          )}

          <div className="flex items-center gap-5 mt-3 text-[15px]">
            <button type="button" className="flex items-center gap-1.5 hover:underline">
              <span className="font-bold text-text-primary tabular-nums">
                {user.stats.followingCount.toLocaleString("tr-TR")}
              </span>
              <span className="text-text-secondary">Takip edilen</span>
            </button>
            <button type="button" className="flex items-center gap-1.5 hover:underline">
              <span className="font-bold text-text-primary tabular-nums">
                {user.stats.followersCount.toLocaleString("tr-TR")}
              </span>
              <span className="text-text-secondary">Takipçi</span>
            </button>
          </div>

          {isFollowedBy && !isSelf ? (
            <p className="text-[13px] text-text-secondary mt-2">
              <span className="text-text-primary font-medium">@{user.username}</span> seni takip ediyor
            </p>
          ) : null}

          {!isSelf && mutualQuery.data && mutualQuery.data.totalCount > 0 ? (
            <ProfileMutualFollowers
              users={mutualQuery.data.data}
              totalCount={mutualQuery.data.totalCount}
            />
          ) : null}

          <ProfileOrbitPills orbits={orbitsQuery.data?.data ?? []} />
        </div>
      </div>
    </header>
  );
}
