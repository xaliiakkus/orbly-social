"use client";

import { formatUserError } from "@orbly/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfilePosts } from "@/components/profile/profile-posts";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { ProfileTabs, type ProfileTab } from "@/components/profile/profile-tabs";
import { ProfileTopBar } from "@/components/profile/profile-top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [editOpen, setEditOpen] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.users.get(username),
    enabled: !!username,
  });

  const follow = useMutation({
    mutationFn: (following: boolean) =>
      following
        ? api.users.unfollow(profile.data!.user.id)
        : api.users.follow(profile.data!.user.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["profile", username] }),
  });

  if (profile.isLoading) {
    return (
      <div className="min-h-screen">
        <ProfileSkeleton />
        <FeedSkeleton rows={4} />
      </div>
    );
  }

  if (profile.isError || !profile.data?.user) {
    return (
      <div className="min-h-screen">
        <ProfileTopBar />
        <EmptyState
          icon={FileText}
          title="Profil bulunamadı"
          description={
            profile.isError
              ? formatUserError(profile.error)
              : "Bu kullanıcı adı mevcut değil."
          }
          className="py-16"
        />
      </div>
    );
  }

  const { user, isFollowing, isSelf } = profile.data;

  return (
    <>
      <div
        className={
          editOpen ? "min-h-screen blur-[3px] pointer-events-none select-none" : "min-h-screen"
        }
      >
        <ProfileTopBar
          displayName={user.displayName}
          postsCount={user.stats.postsCount}
          trailing={
            isSelf ? (
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href="/bookmarks"
                  className="p-2 rounded-full hover:bg-bg-hover"
                  aria-label="Yer imleri"
                >
                  <Bookmark className="h-5 w-5" />
                </Link>
                <Link
                  href="/settings"
                  className="p-2 rounded-full hover:bg-bg-hover"
                  aria-label="Ayarlar"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            ) : undefined
          }
        />

        <ProfileHeader
          user={user}
          isSelf={isSelf}
          isFollowing={isFollowing}
          followPending={follow.isPending}
          onFollowToggle={() => follow.mutate(isFollowing)}
          onEditProfile={() => setEditOpen(true)}
        />

        <ProfileTabs active={tab} onChange={setTab} />

        <ProfilePosts username={username} tab={tab} isSelf={isSelf} />
      </div>

      {isSelf && (
        <EditProfileModal
          user={user}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => void qc.invalidateQueries({ queryKey: ["profile", username] })}
        />
      )}
    </>
  );
}
