import { formatUserError, isRpcTransportError, warnRpcTransportError } from "@orbly/api-client";
import { useMutation } from "@tanstack/react-query";
import type { UserProfileResponse } from "@orbly/types";

import { useApi, useOrblyQueryClient } from "../context";

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
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      const profile = qc.getQueryData<UserProfileResponse>(["profile", username]);
      const targetId = profile?.user.id;
      if (!targetId) {
        throw new Error("profile");
      }
      if (currentlyFollowing) {
        return api.users.unfollow(targetId);
      }
      return api.users.follow(targetId);
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
      options?.onFeedback?.({
        type: "success",
        message: followSuccessMessage(!currentlyFollowing),
      });
    },
    onError: (error, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["profile", username], ctx.prev);
      }
      if (isRpcTransportError(error)) {
        warnRpcTransportError(error, "users.follow");
        return;
      }
      const message = formatUserError(error);
      if (!message) return;
      options?.onFeedback?.({
        type: "error",
        message,
      });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["profile", username] });
    },
  });
}
