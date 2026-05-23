import type { UserPublic } from "@orbly/types";
import { useMutation } from "@tanstack/react-query";

import { useApi, useOrbly, useOrblyQueryClient } from "../context";
import { DEFAULT_POLL_HOURS, MAX_MEDIA_PER_POST, POST_MAX_LENGTH } from "../constants";
import { prependPendingPostToFeeds } from "../offline/cache-optimistic";
import { isQueueableError } from "../offline/network";
import { createClientId } from "../offline/queue-service";

export function useComposePost() {
  const api = useApi();
  const { uploadFile, offlineQueue } = useOrbly();
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      mediaUris,
      externalMediaUrls,
      replyToId,
      orbitId,
      pollOptions,
      author,
    }: {
      content: string;
      mediaUris?: Array<{ uri?: string; blob?: Blob; name: string; type: string }>;
      externalMediaUrls?: string[];
      replyToId?: string;
      orbitId?: string;
      pollOptions?: string[];
      author?: UserPublic;
    }) => {
      const trimmed = content.trim().slice(0, POST_MAX_LENGTH);
      const hasLocalMedia = (mediaUris?.length ?? 0) > 0;
      const opts = pollOptions?.filter((o) => o.trim()) ?? [];

      if (offlineQueue?.isOffline()) {
        if (hasLocalMedia) {
          throw new Error("Çevrimdışıyken yalnızca metin gönderisi kaydedilebilir.");
        }
        if (!author) {
          throw new Error("Oturum gerekli");
        }
        const clientId = createClientId();
        const body = {
          content: trimmed || " ",
          mediaUrls: [...(externalMediaUrls ?? [])].slice(0, MAX_MEDIA_PER_POST),
          replyToId,
          orbitId,
          poll:
            opts.length >= 2
              ? { options: opts, durationHours: DEFAULT_POLL_HOURS }
              : undefined,
        };
        await offlineQueue.enqueue({
          type: "posts.create",
          clientId,
          body,
          author,
        });
        prependPendingPostToFeeds(qc, clientId, body, author);
        return { queued: true as const, clientId };
      }

      let mediaUrls = [...(externalMediaUrls ?? [])];
      if (mediaUris?.length && uploadFile) {
        const uploaded = await Promise.all(mediaUris.map((f) => uploadFile(f)));
        mediaUrls = [...mediaUrls, ...uploaded];
      }
      mediaUrls = mediaUrls.slice(0, MAX_MEDIA_PER_POST);

      try {
        return await api.posts.create({
          content: trimmed || " ",
          mediaUrls,
          replyToId,
          orbitId,
          poll:
            opts.length >= 2
              ? { options: opts, durationHours: DEFAULT_POLL_HOURS }
              : undefined,
        });
      } catch (e) {
        if (offlineQueue && isQueueableError(e) && author && !hasLocalMedia) {
          const clientId = createClientId();
          const body = {
            content: trimmed || " ",
            mediaUrls,
            replyToId,
            orbitId,
            poll:
              opts.length >= 2
                ? { options: opts, durationHours: DEFAULT_POLL_HOURS }
                : undefined,
          };
          await offlineQueue.enqueue({
            type: "posts.create",
            clientId,
            body,
            author,
          });
          prependPendingPostToFeeds(qc, clientId, body, author);
          return { queued: true as const, clientId };
        }
        throw e;
      }
    },
    onSuccess: (_data, vars) => {
      if (_data && "queued" in _data && _data.queued) return;
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["profile-posts"] });
      void qc.invalidateQueries({ queryKey: ["orbit-posts"] });
      void qc.invalidateQueries({ queryKey: ["trending"] });
      if (vars.replyToId) {
        void qc.invalidateQueries({ queryKey: ["post", vars.replyToId] });
        void qc.invalidateQueries({ queryKey: ["replies", vars.replyToId] });
        void qc.invalidateQueries({ queryKey: ["replies"] });
      }
    },
  });
}
