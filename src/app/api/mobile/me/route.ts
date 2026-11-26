import { prisma } from "@/lib/db";
import { requireMobileReader } from "@/lib/mobile-auth";

/**
 * The signed-in reader, plus how full each shelf is.
 *
 * The app calls this on launch to decide whether the token in the keychain
 * is still good, so it doubles as the "is my session alive" check — which is
 * why it does as little work as a shelf count and nothing more.
 */
export async function GET(request: Request) {
  const gate = await requireMobileReader(request);
  if ("response" in gate) return gate.response;

  const counts = await prisma.userBook.groupBy({
    by: ["shelf"],
    where: { userId: gate.reader.id },
    _count: { _all: true },
  });

  const shelves = Object.fromEntries(
    counts.map((row) => [row.shelf, row._count._all]),
  );

  return Response.json(
    { reader: gate.reader, shelves },
    { headers: { "Cache-Control": "no-store" } },
  );
}
