import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * The way out of a session that outlived its account.
 *
 * A JWT is proof on its own — nothing checks it against the database until a
 * page does. So a token for a user row that is gone (account deleted, a
 * database restored, a seed script run again) still reads as signed in to
 * `proxy.ts`, which then sends that visitor from `/login` back to
 * `/dashboard` while `/dashboard` sends them to `/login`: a redirect loop,
 * and the browser gives up with a page that has no app on it at all.
 *
 * The cookie has to go, and only a route handler can take it — a server
 * component cannot write cookies while it renders. Hence this detour instead
 * of `redirect("/login")` straight from `requireCurrentUser`.
 *
 * Checked, not assumed: a session that turns out to be perfectly good is
 * sent on its way untouched. That is what keeps this endpoint harmless on a
 * GET — an `<img src>` on somebody else's page cannot use it to sign a
 * reader out.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const id = session?.user?.id;

  if (id) {
    const stillThere = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (stillThere) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  // Both spellings: Auth.js adds the `__Secure-` prefix over https and not
  // over http, and a long token is split across numbered chunks.
  for (const base of ["authjs.session-token", "__Secure-authjs.session-token"]) {
    response.cookies.delete(base);
    for (let i = 0; i < 4; i++) response.cookies.delete(`${base}.${i}`);
  }
  return response;
}
