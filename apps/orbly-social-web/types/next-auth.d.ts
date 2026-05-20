import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    orblyUser?: Record<string, unknown>;
    accessExpiresAt?: number;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    accessExpiresAt?: number;
    orblyUser?: Record<string, unknown>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessExpiresAt?: number;
    orblyUser?: Record<string, unknown>;
  }
}
