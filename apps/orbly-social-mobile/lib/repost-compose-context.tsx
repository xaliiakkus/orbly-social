import type { PostPublic } from "@orbly/types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type RepostComposeContextValue = {
  quoteTarget: PostPublic | null;
  openQuote: (post: PostPublic) => void;
  closeQuote: () => void;
};

export const RepostComposeContext = createContext<RepostComposeContextValue | null>(null);

export function RepostComposeProvider({ children }: { children: React.ReactNode }) {
  const [quoteTarget, setQuoteTarget] = useState<PostPublic | null>(null);

  const openQuote = useCallback((post: PostPublic) => {
    setQuoteTarget(post);
  }, []);

  const closeQuote = useCallback(() => {
    setQuoteTarget(null);
  }, []);

  const value = useMemo(
    () => ({ quoteTarget, openQuote, closeQuote }),
    [quoteTarget, openQuote, closeQuote],
  );

  return (
    <RepostComposeContext.Provider value={value}>{children}</RepostComposeContext.Provider>
  );
}

export function useRepostCompose() {
  const ctx = useContext(RepostComposeContext);
  if (!ctx) {
    throw new Error("useRepostCompose must be used within RepostComposeProvider");
  }
  return ctx;
}

export function useRepostComposeOptional(): RepostComposeContextValue | null {
  return useContext(RepostComposeContext);
}
