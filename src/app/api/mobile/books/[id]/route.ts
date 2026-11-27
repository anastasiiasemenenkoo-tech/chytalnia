import { prisma } from "@/lib/db";
import { requireMobileReader } from "@/lib/mobile-auth";

/**
 * One book on the reader's shelf, with everything the list leaves out.
 *
 * The list endpoint deliberately omits `review` and `notes` — no screen
 * needed them, and the cheapest way not to leak a column is not to fetch it.
 * The detail screen does show them, so they are selected here, by name.
 *
 * `userId` in the `where` is the security boundary, not a filter. The id in
 * the URL is a cuid belonging to a `UserBook` row, and rows for every reader
 * live in one table: matching on the id alone would hand somebody else's
 * private notes to anyone who guessed, or simply iterated, an id. Scoping
 * the query to the caller makes a wrong id indistinguishable from a missing
 * one, which is also why the 404 below says nothing about whose it was.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireMobileReader(request);
  if ("response" in gate) return gate.response;

  const { id } = await params;

  const book = await prisma.userBook.findFirst({
    where: { id, userId: gate.reader.id },
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

  if (!book) {
    return Response.json(
      { error: "notFound" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { book },
    // Private notes travel in this response; no cache keeps a copy.
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
