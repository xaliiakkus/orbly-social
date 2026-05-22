import { OrblyProvider } from "@orbly/features";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ThemedAppRoot } from "@/components/OrblyThemeProvider";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { RealtimeBridge } from "@/components/RealtimeBridge";
import { ReplyComposeShell } from "@/components/ReplyComposeShell";
import { SocketBootstrap } from "@/components/SocketBootstrap";
import { api } from "@/lib/api";
import { uploadImage } from "@/lib/upload";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <OrblyProvider
        api={api}
        queryClient={client}
        uploadFile={async (file) => {
          if (!file.uri) throw new Error("Dosya yüklenemedi. Tekrar dene.");
          return uploadImage(file.uri, file.name, file.type);
        }}
      >
        <AuthBootstrap />
        <RealtimeBridge />
        <SocketBootstrap />
        <ThemedAppRoot>
          <ReplyComposeShell>{children}</ReplyComposeShell>
        </ThemedAppRoot>
      </OrblyProvider>
    </QueryClientProvider>
  );
}
