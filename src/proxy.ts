import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Runs before every page render: turns signed-out visitors away from the
 * app's own pages and signed-in ones away from the login form.
 *
 * Two things about this file are load-bearing, and both of them fail
 * silently rather than loudly:
 *
 * 1. **It has to live beside `app`.** This project keeps `app` in `src/`, so
 *    the file is `src/proxy.ts`. At the repository root — where it sat until
 *    now, which is where the old `middleware.ts` convention also allowed —
 *    Next compiles it, writes an empty `middleware-manifest.json`, and never
 *    runs it. No warning, no error: routes are simply unguarded, and every
 *    redirect you see is the one the page does for itself.
 *
 * 2. **The export has to be a plain `const proxy`.** Next finds this function
 *    by reading the module's exports before bundling it, and it looks for a
 *    function declaration, a `const proxy = …`, an `export { x as proxy }` or
 *    a default export. `export const { auth: proxy } = NextAuth(config)` — the
 *    obvious one to write, and what this file used to say — destructures, so
 *    the name it declares is inside a pattern where the analyser does not
 *    look. At the root that combination was quiet; in `src/` it is a build
 *    error, which is how it was finally found.
 */
export const proxy = auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
