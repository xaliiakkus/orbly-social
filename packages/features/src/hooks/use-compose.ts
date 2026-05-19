import { useMutation } from "@tanstack/react-query";

import { DEFAULT_POLL_HOURS, MAX_MEDIA_PER_POST, POST_MAX_LENGTH } from "../constants";
import { useApi, useOrbly, useOrblyQueryClient } from "../context";

export type ComposePayload = {
  content: string;
  mediaUrls?: string[];
  replyToId?: string;
  orbitId?: string;
  pollOptions?: string[];
};

export function useComposePost() {
  const api = useApi();
  const { uploadFile } = useOrbly();
  const qc = useOrblyQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      mediaUris,
      externalMediaUrls,
      replyToId,
      orbitId,
      pollOptions,
    }: {
      content: string;
      mediaUris?: Array<{ uri?: string; blob?: Blob; name: string; type: string }>;
      externalMediaUrls?: string[];
      replyToId?: string;
      orbitId?: string;
      pollOptions?: string[];
    }) => {
      const trimmed = content.trim().slice(0, POST_MAX_LENGTH);
      let mediaUrls = [...(externalMediaUrls ?? [])];
      if (mediaUris?.length && uploadFile) {
        const uploaded = await Promise.all(mediaUris.map((f) => uploadFile(f)));
        mediaUrls = [...mediaUrls, ...uploaded];
      }
      mediaUrls = mediaUrls.slice(0, MAX_MEDIA_PER_POST);
      const opts = pollOptions?.filter((o) => o.trim()) ?? [];
      return api.posts.create({
        content: trimmed || " ",
        mediaUrls,
        replyToId,
        orbitId,
        poll:
          opts.length >= 2
            ? { options: opts, durationHours: DEFAULT_POLL_HOURS }
            : undefined,
      });
    },
    onSuccess: (_data, vars) => {
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
