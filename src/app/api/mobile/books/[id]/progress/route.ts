import { requireMobileReader } from "@/lib/mobile-auth";
import {
  mobileBookDetail,
  mobileBookNotFound,
  NO_STORE,
} from "@/lib/mobile-books";
import { applyReadingProgress } from "@/lib/user-books";
import { UpdateProgressSchema } from "@/lib/validators";

/**
 * Save where the reader has got to: `{ pagesRead, totalPages }`.
 *
 * The first endpoint here that writes anything, so a few decisions worth
 * stating:
 *
 * The same `UpdateProgressSchema` the web form is checked against, so the
 * bounds and the "you cannot have read more pages than the book has" rule
 * are one rule rather than two that agree today. Its messages are already
 * keys (`pagesReadRange`, `pagesExceedTotal`) which the web resolves through
 * the dictionary — here they go out as they are, and the phone owns the
 * Ukrainian. That is the same division as `invalidCredentials` at sign-in.
 *
 * The id comes from the path, never the body, so a reader cannot aim an
 * update at a row by sending its id in a field the URL does not mention.
 *
 * And the reply is the whole saved record, not an acknowledgement. Finishing
 * a book moves it to the read shelf and stamps a finish date — work the
 * server decides and the phone would otherwise have to re-derive, or guess.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireMobileReader(request);
  if ("response" in gate) return gate.response;

  const { id } = await params;

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json(
      { error: "invalidBody" },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = UpdateProgressSchema.safeParse({
    ...body,
    userBookId: id,
  });
  if (!parsed.success) {
    // The field the reader can actually fix, preferred over whichever issue
    // zod happens to list first — and `totalPages` ahead of `pagesRead`,
    // for the reason spelled out in `updateReadingProgress`.
    const issue =
      ["totalPages", "pagesRead"]
        .map((field) =>
          parsed.error.issues.find((i) => i.path[0] === field),
        )
        .find((i) => i !== undefined) ?? parsed.error.issues[0];

    return Response.json(
      { error: issue?.message ?? "invalidBody" },
      { status: 422, headers: NO_STORE },
    );
  }

  const result = await applyReadingProgress({
    userId: gate.reader.id,
    ...parsed.data,
  });
  if (!result.ok) return mobileBookNotFound();

  const book = await mobileBookDetail(gate.reader.id, id);
  if (!book) return mobileBookNotFound();

  return Response.json({ book, promoted: result.promoted }, { headers: NO_STORE });
}
