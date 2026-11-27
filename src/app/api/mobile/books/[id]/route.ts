import { requireMobileReader } from "@/lib/mobile-auth";
import {
  mobileBookDetail,
  mobileBookNotFound,
  NO_STORE,
} from "@/lib/mobile-books";

/**
 * One book on the reader's shelf, with everything the list leaves out.
 *
 * The list endpoint deliberately omits `review` and `notes` — no screen
 * needed them, and the cheapest way not to leak a column is not to fetch it.
 * The detail screen does show them, so they are selected by name in
 * `mobileBookDetail`, which also explains why the query is scoped to the
 * caller rather than trusting the id in the URL.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireMobileReader(request);
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const book = await mobileBookDetail(gate.reader.id, id);
  if (!book) return mobileBookNotFound();

  return Response.json({ book }, { headers: NO_STORE });
}
