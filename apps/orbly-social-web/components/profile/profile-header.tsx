"use client";

import { BadgeCheck, Calendar, Link2, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";
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
  onFollowToggle,
  followPending,
  onEditProfile,
}: {
  user: UserPublic;
  isSelf: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  followPending?: boolean;
  onEditProfile?: () => void;
}) {
  const banner = resolveMediaUrl(user.bannerUrl);

  return (
    <header>
      <div className="relative w-full aspect-[3/1] max-h-[200px] min-h-[122px] bg-bg-secondary overflow-hidden">
        {banner ? (
          <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#333] via-bg-secondary to-bg-primary" />
        )}
      </div>

      <div className="px-4 pb-0">
        <div className="flex justify-between items-start gap-3 -mt-[68px] mb-3">
          <Avatar
            src={user.avatarUrl}
            name={user.displayName}
            size="xl"
            className="h-[134px] w-[134px] max-sm:h-[84px] max-sm:w-[84px] text-[3.5rem] z-10 max-sm:text-2xl border-4 border-bg-primary shrink-0"
          />
          <div className="flex gap-2 mt-[76px] max-sm:mt-[44px] shrink-0">
            {isSelf ? (
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-full px-4 h-9 border-text-secondary/80 hover:bg-bg-hover"
                onClick={onEditProfile}
              >
                Profili düzenle
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold rounded-full px-4 h-9 border-text-secondary/80 hover:bg-bg-hover"
                >
                  …
                </Button>
                <Button
                  variant={isFollowing ? "outline" : "primary"}
                  size="sm"
                  className="font-bold rounded-full px-4 h-9 min-w-[106px] border-text-secondary/80"
                  onClick={onFollowToggle}
                  disabled={followPending}
                >
                  {isFollowing ? "Takip ediliyor" : "Takip et"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="pb-3">
          <div className="flex items-center gap-1 min-w-0">
            <h1 className="text-[20px] font-extrabold leading-6 truncate">{user.displayName}</h1>
            {user.verified && (
              <BadgeCheck className="h-[1.25em] w-[1.25em] shrink-0 text-accent fill-accent/20" />
            )}
          </div>
          <p className="text-text-secondary text-[15px] leading-5">@{user.username}</p>
        </div>

        {user.bio && (
          <p className="pb-3 text-[15px] leading-5 whitespace-pre-wrap break-words">{user.bio}</p>
        )}

        {(user.location || user.website || user.createdAt) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 pb-3 text-text-secondary text-[15px] leading-5">
            {user.location && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{user.location}</span>
              </span>
            )}
            {user.website && (
              <a
                href={websiteHref(user.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline min-w-0"
              >
                <Link2 className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{formatWebsiteDisplay(user.website)}</span>
              </a>
            )}
            {user.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-[18px] w-[18px] shrink-0" />
                {formatJoinDate(user.createdAt)}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-5 pb-3 text-[15px] leading-5">
          <button type="button" className="hover:underline">
            <span className="font-bold text-text-primary">
              {formatCount(user.stats.followingCount)}
            </span>{" "}
            <span className="text-text-secondary">Takip edilen</span>
          </button>
          <button type="button" className="hover:underline">
            <span className="font-bold text-text-primary">
              {formatCount(user.stats.followersCount)}
            </span>{" "}
            <span className="text-text-secondary">Takipçi</span>
          </button>
        </div>
      </div>
    </header>
  );
}
