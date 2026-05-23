"use client";

import type { ApiClient } from "@orbly/api-client";
import type { QueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

import type { FlushOfflineResult } from "./offline/queue-service";
import type { OfflineQueueBridge } from "./offline/types";

export type UploadFileInput = {
  uri?: string;
  blob?: Blob;
  name: string;
  type: string;
};

export type UploadHandler = (file: UploadFileInput) => Promise<string>;

type OrblyContextValue = {
  api: ApiClient;
  queryClient: QueryClient;
  uploadFile?: UploadHandler;
  offlineQueue?: OfflineQueueBridge;
  flushOfflineQueue?: () => Promise<FlushOfflineResult>;
};

const OrblyContext = createContext<OrblyContextValue | null>(null);

export function OrblyProvider({
  api,
  queryClient,
  uploadFile,
  offlineQueue,
  flushOfflineQueue,
  children,
}: {
  api: ApiClient;
  queryClient: QueryClient;
  uploadFile?: UploadHandler;
  offlineQueue?: OfflineQueueBridge;
  flushOfflineQueue?: () => Promise<FlushOfflineResult>;
  children: ReactNode;
}) {
  return (
    <OrblyContext.Provider
      value={{ api, queryClient, uploadFile, offlineQueue, flushOfflineQueue }}
    >
      {children}
    </OrblyContext.Provider>
  );
}

export function useOrbly() {
  const ctx = useContext(OrblyContext);
  if (!ctx) throw new Error("useOrbly must be used within OrblyProvider");
  return ctx;
}

export function useApi() {
  return useOrbly().api;
}

export function useOrblyQueryClient() {
  return useOrbly().queryClient;
}
