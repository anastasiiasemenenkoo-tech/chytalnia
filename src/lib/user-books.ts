import { settleDuelsForFinishedBook } from "@/actions/duels";
import { prisma } from "@/lib/db";
import type { ShelfValue } from "@/lib/validators";

/**
 * Put a book on someone's shelf, moving it if it is already there.
 *
 * Deliberately not in a `"use server"` module: every export of one of those
 * becomes a callable endpoint, and this takes a `userId` it does not check.
 */
export async function upsertUserBook(args: {
  userId: string;
  bookId: string;
  shelf: ShelfValue;
}) {
  const where = { userId_bookId: { userId: args.userId, bookId: args.bookId } };

  // The date a book was finished is the one thing here that cannot be
  // recovered — the year in review and the yearly goal are both built from
  // it. Writing `new Date()` every time meant adding a book you had already
  // read (from a club, or a second trip through search) silently moved its
  // finish date to today. Keep the one on record; only a book that has none
  // gets stamped now.
  const existing = await prisma.userBook.findUnique({
    where,
    select: { finishedAt: true },
  });
  const finishedAt =
    args.shelf === "READ" ? (existing?.finishedAt ?? new Date()) : null;

  const userBook = await prisma.userBook.upsert({
    where,
    update: { shelf: args.shelf, finishedAt },
    create: {
      userId: args.userId,
      bookId: args.bookId,
      shelf: args.shelf,
      finishedAt,
    },
  });
  if (args.shelf === "READ") {
    await settleDuelsForFinishedBook(args.userId, args.bookId);
  }
  return userBook;
}
