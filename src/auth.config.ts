import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/books",
  "/clubs",
  "/duels",
  "/readers",
  "/settings",
  // `/year` is the reader's own year in review. Leaving it off meant a
  // signed-out visit reached the page, which redirects itself — losing the
  // `next` parameter, so signing in dropped them on the dashboard instead
  // of where they were going. `/y/<token>` is the public one and stays open.
  "/year",
];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
      const isAuthPage = AUTH_PAGES.includes(path);

      if (isProtected && !isLoggedIn) {
        const url = new URL("/login", nextUrl);
        url.searchParams.set("next", path);
        return Response.redirect(url);
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
