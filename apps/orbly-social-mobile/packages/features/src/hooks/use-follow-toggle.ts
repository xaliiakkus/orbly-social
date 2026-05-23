import { formatUserError } from "@orbly/api-client";
import { useMutation } from "@tanstack/react-query";
import type { UserProfileResponse } from "@orbly/types";

import { useApi, useOrbly, useOrblyQueryClient } from "../context";
import { isQueueableError } from "../offline/network";

export type FollowFeedback = {
  type: "success" | "error";
  message: string;
};

export function followSuccessMessage(following: boolean): string {
  return following
    ? "Bu hesabı takip ediyorsun."
    : "Takibi bıraktın.";
}

export function useFollowToggle(
  username: string,
  options?: {
    onFeedback?: (feedback: FollowFeedback) => void;
  },
) {
  const api = useApi();
  const { offlineQueue } = useOrbly();
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      const profile = qc.getQueryData<UserProfileResponse>(["profile", username]);
      const targetId = profile?.user.id;
      if (!targetId) {
        throw new Error("profile");
      }

      const nextFollowing = !currentlyFollowing;

      if (offlineQueue?.isOffline()) {
        await offlineQueue.enqueue({
          type: nextFollowing ? "users.follow" : "users.unfollow",
          userId: targetId,
        });
        return { following: nextFollowing };
      }

      try {
        if (currentlyFollowing) {
          return api.users.unfollow(targetId);
        }
        return api.users.follow(targetId);
      } catch (e) {
        if (offlineQueue && isQueueableError(e)) {
          await offlineQueue.enqueue({
            type: nextFollowing ? "users.follow" : "users.unfollow",
            userId: targetId,
          });
          return { following: nextFollowing };
        }
        throw e;
      }
    },
    onMutate: async (currentlyFollowing) => {
      await qc.cancelQueries({ queryKey: ["profile", username] });
      const prev = qc.getQueryData<UserProfileResponse>(["profile", username]);
      if (prev) {
        const nextFollowing = !currentlyFollowing;
        qc.setQueryData<UserProfileResponse>(["profile", username], {
          ...prev,
          isFollowing: nextFollowing,
          user: {
            ...prev.user,
            stats: {
              ...prev.user.stats,
              followersCount: Math.max(
                0,
                prev.user.stats.followersCount + (nextFollowing ? 1 : -1),
              ),
            },
          },
        });
      }
      return { prev };
    },
    onSuccess: (_data, currentlyFollowing) => {
      const queued = offlineQueue?.isOffline();
      options?.onFeedback?.({
        type: "success",
        message: queued
          ? "Çevrimdışı kaydedildi; bağlantı gelince senkronize edilir."
          : followSuccessMessage(!currentlyFollowing),
      });
    },
    onError: (error, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["profile", username], ctx.prev);
      }
      const msg = formatUserError(error);
      options?.onFeedback?.({
        type: "error",
        message:
          msg.includes("giriş") || msg.includes("Oturum")
            ? msg
            : "Takip işlemi tamamlanamadı. Lütfen tekrar dene.",
      });
    },
    onSettled: () => {
      if (!offlineQueue?.isOffline()) {
        void qc.invalidateQueries({ queryKey: ["profile", username] });
      }
    },
  });
}
