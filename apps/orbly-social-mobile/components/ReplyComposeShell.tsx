import { useQueryClient } from "@tanstack/react-query";

import { ReplyComposeModal } from "@/components/ReplyComposeModal";
import { ReplyComposeProvider } from "@/lib/reply-compose-context";

export function ReplyComposeShell({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const onPosted = () => {
    void qc.invalidateQueries({ queryKey: ["feed"] });
    void qc.invalidateQueries({ queryKey: ["replies"] });
    void qc.invalidateQueries({ queryKey: ["post"] });
  };

  return (
    <ReplyComposeProvider>
      {children}
      <ReplyComposeModal onPosted={onPosted} />
    </ReplyComposeProvider>
  );
}
