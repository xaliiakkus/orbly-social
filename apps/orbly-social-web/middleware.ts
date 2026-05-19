import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/home/:path*",
    "/explore/:path*",
    "/notifications/:path*",
    "/messages/:path*",
    "/orbits/:path*",
    "/bookmarks/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/post/:path*",
    "/onboarding",
    "/live/:path*",
  ],
};
