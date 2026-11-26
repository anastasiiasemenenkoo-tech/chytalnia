import { prisma } from "@/lib/db";
import { requireMobileReader } from "@/lib/mobile-auth";
import { ShelfEnum } from "@/lib/validators";

/**
 * The reader's own shelves, optionally one shelf at a time.
 *
 * Note the explicit `select`. These are the caller's own rows, so their
 * private notes would be theirs to read — but the payload leaves `notes` and
 * `review` out anyway, because no screen in the app shows them yet and the
 * cheapest way to not leak a column over the network is to not fetch it.
 * `src/lib/private-columns.test.ts` is what keeps this honest; see the long
 * comment at the top of that file for the bug that earned the rule.
 */
export async function GET(request: Request) {
  const gate = await requireMobileReader(request);
  if ("response" in gate) return gate.response;

  const requested = new URL(request.url).searchParams.get("shelf");
  const shelf = requested ? ShelfEnum.safeParse(requested) : null;
  if (shelf && !shelf.success) {
    return Response.json(
      { error: "shelfInvalid" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const books = await prisma.userBook.findMany({
    where: {
      userId: gate.reader.id,
      ...(shelf?.success ? { shelf: shelf.data } : {}),
    },
    select: {
      id: true,
      shelf: true,
      addedAt: true,
      finishedAt: true,
      pagesRead: true,
      totalPages: true,
      rating: true,
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
    // Newest first: the shelf screen is read from the top and "what did I
    // just add" is the question it answers most often.
    orderBy: { addedAt: "desc" },
  });

  return Response.json(
    { books },
    { headers: { "Cache-Control": "no-store" } },
  );
}
