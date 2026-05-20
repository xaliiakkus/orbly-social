"use client";

import { useQueryClient } from "@tanstack/react-query";

import { ReplyComposeProvider } from "@/components/post/reply-compose-context";
import { ReplyComposeModal } from "@/components/post/reply-compose-modal";
import { RepostComposeProvider } from "@/components/post/repost-compose-context";
import { RepostComposeModal } from "@/components/post/repost-compose-modal";

export function ReplyComposeShell({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const onPosted = () => {
    void qc.invalidateQueries({ queryKey: ["feed"] });
    void qc.invalidateQueries({ queryKey: ["replies"] });
    void qc.invalidateQueries({ queryKey: ["post"] });
  };

  return (
    <ReplyComposeProvider>
      <RepostComposeProvider>
        {children}
        <ReplyComposeModal onPosted={onPosted} />
        <RepostComposeModal onPosted={onPosted} />
      </RepostComposeProvider>
    </ReplyComposeProvider>
  );
}
