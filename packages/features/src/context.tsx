"use client";

import type { ApiClient } from "@orbly/api-client";
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
  uploadFile?: UploadHandler;
};

const OrblyContext = createContext<OrblyContextValue | null>(null);

export function OrblyProvider({
  api,
  uploadFile,
  children,
}: {
  api: ApiClient;
  uploadFile?: UploadHandler;
  children: ReactNode;
}) {
  return (
    <OrblyContext.Provider value={{ api, uploadFile }}>
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
