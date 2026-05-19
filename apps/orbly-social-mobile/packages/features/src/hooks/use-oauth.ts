import { useMutation } from "@tanstack/react-query";

import { useApi } from "../context";

export type OAuthProvider = "google" | "apple";

export type OAuthLoginInput = {
  provider: OAuthProvider;
  idToken: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  oauthId?: string;
};

export function useOAuthLogin() {
  const api = useApi();
  return useMutation({
    mutationFn: (body: OAuthLoginInput) => api.auth.oauth(body),
  });
}
