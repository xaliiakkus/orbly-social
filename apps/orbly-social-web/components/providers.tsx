"use client";

import { OrblyProvider } from "@orbly/features";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { SessionSync } from "@/components/auth/session-sync";
import { OfflineBootstrap } from "@/components/OfflineBootstrap";
import { SocketBootstrap } from "@/components/SocketBootstrap";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { api } from "@/lib/api";
import { flushWebOfflineQueue, webOfflineQueue } from "@/lib/offline-queue";
import { installRpcRejectionHandler } from "@/lib/install-rpc-rejection-handler";
import { uploadFile as uploadFileWeb } from "@/lib/upload";

installRpcRejectionHandler();

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <OrblyProvider
          api={api}
          queryClient={client}
          offlineQueue={webOfflineQueue}
          flushOfflineQueue={() => flushWebOfflineQueue(client)}
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
          <SocketBootstrap />
          <OfflineBootstrap />
          <ThemeProvider>{children}</ThemeProvider>
        </OrblyProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
