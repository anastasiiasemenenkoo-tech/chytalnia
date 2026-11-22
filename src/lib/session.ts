import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return user;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    // `proxy.ts` turns most signed-out visits away before they get here, but
    // not all of them: a token can still be valid while the row it points at
    // is gone. Throwing made that a 500, and a 500 answering the RSC request
    // behind a <Link> click is invisible — the router drops the navigation
    // and the page just sits there. A redirect is something it understands.
    //
    // Not straight to `/login`, though. To the proxy that cookie still reads
    // as a session, so it would send them back to `/dashboard`, which sends
    // them here again — a loop the browser ends with an error page. The
    // route handler can do what this render cannot: delete the cookie.
    redirect("/api/session/stale");
  }
  return user;
}
