"use client";

import { formatUserError } from "@orbly/api-client";
import { useFollowToggle, useStartConversation, type FollowFeedback } from "@orbly/features";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfilePosts } from "@/components/profile/profile-posts";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { ProfileTabs, type ProfileTab } from "@/components/profile/profile-tabs";
import { ProfileTopBar } from "@/components/profile/profile-top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { UserFeedbackBanner } from "@/components/ui/user-feedback";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<FollowFeedback | null>(null);
  const startDm = useStartConversation();

  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.users.get(username),
    enabled: !!username,
  });

  const follow = useFollowToggle(username, {
    onFeedback: (f) => {
      setFeedback(f);
      if (f.type === "success") {
        window.setTimeout(() => setFeedback(null), 3500);
      }
    },
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

  const { user, isFollowing, isSelf, canMessage } = profile.data;

  const onMessage = () => {
    if (!canMessage) {
      window.alert("Mesaj göndermek için ikinizin de birbirinizi takip etmesi gerekir.");
      return;
    }
    startDm.mutate(user.id, {
      onSuccess: ({ conversationId }) => router.push(`/messages/${conversationId}`),
      onError: (err) => window.alert(formatUserError(err)),
    });
  };

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

        {feedback ? (
          <UserFeedbackBanner
            message={feedback.message}
            variant={feedback.type}
            onDismiss={() => setFeedback(null)}
          />
        ) : null}

        <ProfileHeader
          user={user}
          isSelf={isSelf}
          isFollowing={isFollowing}
          followPending={follow.isPending}
          onFollowToggle={() => follow.mutate(isFollowing)}
          onEditProfile={() => setEditOpen(true)}
          onMessage={isSelf ? undefined : onMessage}
          canMessage={canMessage}
          messagePending={startDm.isPending}
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
