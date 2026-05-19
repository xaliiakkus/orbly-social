"use client";

import { OrblyProvider } from "@orbly/features";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { SessionSync } from "@/components/auth/session-sync";
import { api } from "@/lib/api";
import { uploadFile as uploadFileWeb } from "@/lib/upload";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <OrblyProvider
          api={api}
          queryClient={client}
          uploadFile={async (file) => {
            if (file.blob) {
              return uploadFileWeb(
                new File([file.blob], file.name, { type: file.type }),
              );
            }
            throw new Error("Web upload requires blob");
          }}
        >
          <SessionSync />
          {children}
        </OrblyProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
