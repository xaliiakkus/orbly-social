"use client";

import type { ApiClient } from "@orbly/api-client";
import type { QueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

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
};

const OrblyContext = createContext<OrblyContextValue | null>(null);

export function OrblyProvider({
  api,
  queryClient,
  uploadFile,
  children,
}: {
  api: ApiClient;
  queryClient: QueryClient;
  uploadFile?: UploadHandler;
  children: ReactNode;
}) {
  return (
    <OrblyContext.Provider value={{ api, queryClient, uploadFile }}>
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
