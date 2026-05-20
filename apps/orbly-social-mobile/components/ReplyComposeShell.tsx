import { useQueryClient } from "@tanstack/react-query";

import { ReplyComposeModal } from "@/components/ReplyComposeModal";
import { RepostComposeModal } from "@/components/RepostComposeModal";
import { ReplyComposeProvider } from "@/lib/reply-compose-context";
import { RepostComposeProvider } from "@/lib/repost-compose-context";

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
