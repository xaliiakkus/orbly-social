import type { NextAuthOptions } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { generateAppleClientSecret } from "@/lib/apple-client-secret";
import { getApiBaseUrl } from "@/lib/api-url";

const API = getApiBaseUrl();

type AuthTokensPayload = {
  user: Record<string, unknown>;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
};

async function exchangeOAuth(body: Record<string, unknown>) {
  const res = await fetch(`${API}/v1/auth/oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json() as Promise<AuthTokensPayload>;
}

const appleConfigured =
  process.env.APPLE_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY;

function appleProviders() {
  if (!appleConfigured) return [];
  try {
    return [
      AppleProvider({
        clientId: process.env.APPLE_ID!,
        clientSecret: generateAppleClientSecret(),
      }),
    ];
  } catch (err) {
    console.warn("[auth] Apple provider disabled:", err);
    return [];
  }
}

const devFallbackSecret = "orbly-dev-nextauth-secret-change-in-production!!";

const ACCESS_REFRESH_BUFFER_MS = 60_000;

/** Sunucu JWT: süre dolmadan sessiz yenile; başarısızsa eski token kalır (çıkış yok). */
async function refreshAccessToken(
  token: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const refreshToken = token.refreshToken as string | undefined;
  if (!refreshToken) return token;

  const expiresAt = token.accessExpiresAt as number | undefined;
  if (!expiresAt && token.accessToken) {
    return { ...token, accessExpiresAt: Date.now() + 15 * 60 * 1000 };
  }
  if (expiresAt && Date.now() < expiresAt - ACCESS_REFRESH_BUFFER_MS) {
    return token;
  }

  try {
    const res = await fetch(`${API}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return token;
    const data = (await res.json()) as AuthTokensPayload;
    return applyAuthPayload(token, data);
  } catch {
    return token;
  }
}

function applyAuthPayload(
  token: Record<string, unknown>,
  data: AuthTokensPayload,
): Record<string, unknown> {
  return {
    ...token,
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
    orblyUser: data.user,
    accessExpiresAt: Date.now() + data.tokens.expiresIn * 1000,
    error: undefined,
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? devFallbackSecret,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login", newUser: "/onboarding", error: "/login" },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...appleProviders(),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const res = await fetch(`${API}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          user: Record<string, unknown>;
          tokens: { accessToken: string; refreshToken: string; expiresIn: number };
        };
        return {
          id: data.user.id as string,
          email: data.user.email as string | undefined,
          name: data.user.displayName as string,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          accessExpiresAt: Date.now() + data.tokens.expiresIn * 1000,
          orblyUser: data.user,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      if (trigger === "update" && session) {
        const patch = session as {
          accessToken?: string;
          refreshToken?: string;
          orblyUser?: Record<string, unknown>;
          accessExpiresAt?: number;
        };
        if (patch.accessToken) token.accessToken = patch.accessToken;
        if (patch.refreshToken) token.refreshToken = patch.refreshToken;
        if (patch.orblyUser) token.orblyUser = patch.orblyUser;
        if (patch.accessExpiresAt) token.accessExpiresAt = patch.accessExpiresAt;
        return token;
      }
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.orblyUser = user.orblyUser;
        if (user.accessExpiresAt) {
          token.accessExpiresAt = user.accessExpiresAt;
        }
      }
      if (account?.provider === "google" && account.id_token) {
        const email =
          (profile as { email?: string } | undefined)?.email ??
          token.email ??
          undefined;
        const data = await exchangeOAuth({
          provider: "google",
          email,
          displayName:
            (profile as { name?: string } | undefined)?.name ??
            email?.split("@")[0] ??
            "User",
          idToken: account.id_token,
          avatarUrl: (profile as { picture?: string } | undefined)?.picture,
          oauthId: account.providerAccountId,
        });
        if (data) {
          Object.assign(token, applyAuthPayload(token, data));
        }
      }
      if (account?.provider === "apple" && account.id_token) {
        const email =
          (profile as { email?: string } | undefined)?.email ??
          token.email ??
          undefined;
        const data = await exchangeOAuth({
          provider: "apple",
          email,
          displayName: email?.split("@")[0] ?? "Apple User",
          idToken: account.id_token,
          oauthId: account.providerAccountId,
        });
        if (data) {
          Object.assign(token, applyAuthPayload(token, data));
        }
      }
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.orblyUser = token.orblyUser as Record<string, unknown>;
      session.accessExpiresAt = token.accessExpiresAt as number | undefined;
      return session;
    },
  },
};
