import "server-only";

import { prisma } from "@/lib/db";

/**
 * One book on a reader's shelf, with everything the list endpoint leaves out.
 *
 * Two handlers answer with this shape — the detail GET and the progress
 * PATCH, which replies with the saved record so the phone has no reason to
 * guess what the server decided. The columns are named here once so the two
 * cannot quietly disagree about which ones travel.
 *
 * `userId` in the `where` is the security boundary, not a filter. The id in
 * the URL is a cuid belonging to a `UserBook` row, and rows for every reader
 * live in one table: matching on the id alone would hand somebody else's
 * private notes to anyone who guessed, or simply iterated, an id. Scoping
 * the query to the caller makes a wrong id indistinguishable from a missing
 * one — which is also why the 404s say nothing about whose book it was.
 */
export async function mobileBookDetail(userId: string, userBookId: string) {
  return prisma.userBook.findFirst({
    where: { id: userBookId, userId },
    select: {
      id: true,
      shelf: true,
      addedAt: true,
      finishedAt: true,
      pagesRead: true,
      totalPages: true,
      progressUpdated: true,
      rating: true,
      ratedAt: true,
      review: true,
      reviewUpdatedAt: true,
      notes: true,
      notesUpdatedAt: true,
      book: {
        select: {
          id: true,
          olid: true,
          title: true,
          author: true,
          coverUrl: true,
        },
      },
    },
  });
}

/** Private notes travel in these responses; no cache keeps a copy. */
export const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export function mobileBookNotFound() {
  return Response.json({ error: "notFound" }, { status: 404, headers: NO_STORE });
}
