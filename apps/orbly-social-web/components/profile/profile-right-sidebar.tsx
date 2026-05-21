"use client";

import { formatUserError } from "@orbly/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { LiveSpacesSidebar } from "@/components/live/live-spaces-sidebar";
import { MobileSearchBar } from "@/components/layout/mobile-search-bar";
import { TrendingCard } from "@/components/layout/trending-card";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import {
  ORBLY_SUPPORT_EMAIL,
  ORBLY_SUPPORT_MAILTO,
  supportMailtoSubject,
} from "@/lib/app-contact";
import { formatCount } from "@/lib/format";
import type { OrbitPublic } from "@orbly/types";

function ProfileSummaryCard({ username }: { username: string }) {
  const { data } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.users.get(username),
    enabled: !!username,
    staleTime: 60_000,
  });

  const user = data?.user;
  if (!user) return null;

  const stats = [
    { label: "Gönderi", value: user.stats.postsCount },
    { label: "Takipçi", value: user.stats.followersCount },
    { label: "Takip", value: user.stats.followingCount },
  ];

  const max = Math.max(...stats.map((s) => s.value), 1);

  return (
    <div className="glass-card p-4">
      <h2 className="text-[17px] font-bold text-text-primary mb-3">Profil özeti</h2>
      <div className="flex items-end gap-2 h-20 mb-2">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className="w-full rounded-sm bg-accent/80 min-h-[4px] transition-all"
              style={{ height: `${Math.max(8, (s.value / max) * 72)}px` }}
              title={`${formatCount(s.value)} ${s.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 text-center min-w-0">
            <p className="text-[13px] text-text-secondary truncate">{s.label}</p>
            <p className="text-[15px] font-bold tabular-nums">{formatCount(s.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileMutualFollowersCard({ username }: { username: string }) {
  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.users.get(username),
    enabled: !!username,
    staleTime: 60_000,
  });

  const mutual = useQuery({
    queryKey: ["profile-mutual-followers", username],
    queryFn: () => api.users.mutualFollowers(username, 4),
    enabled: !!username && !profile.data?.isSelf,
    staleTime: 60_000,
  });

  if (!mutual.data?.totalCount) return null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-[17px] font-bold text-text-primary">Ayrıca takip edenler</h2>
      </div>
      {mutual.data.data.map((u) => (
        <Link
          key={u.id}
          href={`/profile/${u.username}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover/50 transition-colors"
        >
          <Avatar src={u.avatarUrl} name={u.displayName} size="md" className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-[15px] font-bold truncate">{u.displayName}</p>
              {u.verified ? (
                <BadgeCheck className="h-3.5 w-3.5 text-accent shrink-0" aria-label="Doğrulanmış" />
              ) : null}
            </div>
            <p className="text-[13px] text-text-secondary truncate">@{u.username}</p>
          </div>
        </Link>
      ))}
      {mutual.data.totalCount > mutual.data.data.length ? (
        <p className="px-4 pb-3 text-[13px] text-text-secondary">
          +{formatCount(mutual.data.totalCount - mutual.data.data.length)} kişi daha
        </p>
      ) : null}
    </div>
  );
}

function SuggestedOrbitRow({
  orbit,
  joined,
  onToggle,
  pending,
}: {
  orbit: OrbitPublic;
  joined: boolean;
  onToggle: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover/50 transition-colors">
      <div
        className={cn(
          "w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0",
          "text-orbit font-extrabold text-lg",
        )}
      >
        {orbit.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold truncate">{orbit.name}</p>
        <p className="text-[13px] text-text-secondary">
          {formatCount(orbit.stats.memberCount)} üye
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={onToggle}
        className={cn(
          "text-[14px] px-3 py-1.5 shrink-0 font-bold rounded-full transition-transform active:scale-95 disabled:opacity-50",
          joined ? "btn-following" : "btn-follow",
        )}
      >
        {joined ? "Katıldın" : "Katıl"}
      </button>
    </div>
  );
}

function ProfileSuggestedOrbitsCard() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const myOrbitIds = new Set(me?.orbitIds ?? []);

  const { data } = useQuery({
    queryKey: ["orbits"],
    queryFn: () => api.orbits.list(),
    staleTime: 120_000,
  });

  const join = useMutation({
    mutationFn: (slug: string) => api.orbits.join(slug),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ["orbits"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["profile-orbits"] });
      try {
        const me = await api.auth.me();
        useAuthStore.getState().setUser(me.user);
      } catch {
        /* auth yenileme isteğe bağlı */
      }
    },
    onError: (err) => window.alert(formatUserError(err)),
  });

  const suggestions = (data?.data ?? []).filter((o) => !myOrbitIds.has(o.id)).slice(0, 3);
  if (!suggestions.length || !me) return null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-[17px] font-bold text-text-primary">{"Beğenebileceğin orbit'ler"}</h2>
      </div>
      {suggestions.map((orbit) => (
        <SuggestedOrbitRow
          key={orbit.id}
          orbit={orbit}
          joined={myOrbitIds.has(orbit.id)}
          pending={join.isPending}
          onToggle={() => join.mutate(orbit.slug)}
        />
      ))}
    </div>
  );
}

export function ProfileRightSidebar({ username }: { username: string }) {
  return (
    <aside className="hidden lg:block w-[350px] shrink-0 py-2 pl-4 pr-6">
      <div className="sticky top-2 space-y-4 max-h-[calc(100dvh-16px)] overflow-y-auto scrollbar-hide">
        <MobileSearchBar />
        <ProfileSummaryCard username={username} />
        <ProfileMutualFollowersCard username={username} />
        <ProfileSuggestedOrbitsCard />
        <TrendingCard />
        <LiveSpacesSidebar />
        <footer className="px-2 text-text-tertiary text-[13px] leading-5">
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
            <a href={supportMailtoSubject("Destek")} className="hover:underline">
              Destek
            </a>
            {["Koşullar", "Gizlilik", "Çerezler"].map((item) => (
              <button key={item} type="button" className="hover:underline">
                {item}
              </button>
            ))}
          </div>
          <a href={ORBLY_SUPPORT_MAILTO} className="hover:underline block mb-2">
            {ORBLY_SUPPORT_EMAIL}
          </a>
          <span>© 2026 Orbly</span>
        </footer>
      </div>
    </aside>
  );
}
