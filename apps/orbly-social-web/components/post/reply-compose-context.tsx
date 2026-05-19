"use client";

import type { PostPublic } from "@orbly/types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ReplyComposeContextValue = {
  targetPost: PostPublic | null;
  openReply: (post: PostPublic) => void;
  closeReply: () => void;
};

const ReplyComposeContext = createContext<ReplyComposeContextValue | null>(null);

export function ReplyComposeProvider({ children }: { children: React.ReactNode }) {
  const [targetPost, setTargetPost] = useState<PostPublic | null>(null);

  const openReply = useCallback((post: PostPublic) => {
    setTargetPost(post);
  }, []);

  const closeReply = useCallback(() => {
    setTargetPost(null);
  }, []);

  const value = useMemo(
    () => ({ targetPost, openReply, closeReply }),
    [targetPost, openReply, closeReply],
  );

  return (
    <ReplyComposeContext.Provider value={value}>
      {children as any}
    </ReplyComposeContext.Provider>
  );
}

export function useReplyCompose() {
  const ctx = useContext(ReplyComposeContext);
  if (!ctx) {
    throw new Error("useReplyCompose must be used within ReplyComposeProvider");
  }
  return ctx;
}

export function useReplyComposeOptional() {
  return useContext(ReplyComposeContext);
}
