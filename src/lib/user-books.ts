import { revalidatePath } from "next/cache";

import { settleDuelsForFinishedBook } from "@/actions/duels";
import { prisma } from "@/lib/db";
import { readingProgressVerdict } from "@/lib/reading-progress";
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

export type ProgressResult =
  | { ok: true; promoted: boolean }
  | { ok: false; reason: "notFound" };

/**
 * Write a reader's place in a book, and everything that follows from it.
 *
 * Here rather than in `src/actions/books.ts` because the phone cannot reach
 * a server action — those are an internal RPC keyed to the build — and so
 * `/api/mobile/books/[id]/progress` needs the same work done. What must not
 * drift between the two is the tail of it: the promotion to the read shelf,
 * the finish date, the duels that promotion settles. A second copy of that
 * would pass every test and still leave a duel hanging whenever a reader
 * finished a book away from their laptop.
 *
 * Takes a `userId` it does not authenticate, like everything else in this
 * file: the caller proves who is asking, this decides what they may touch.
 */
export async function applyReadingProgress(args: {
  userId: string;
  userBookId: string;
  pagesRead: number;
  totalPages: number;
}): Promise<ProgressResult> {
  const existing = await prisma.userBook.findUnique({
    where: { id: args.userBookId },
    select: { userId: true, shelf: true, bookId: true },
  });

  // An id is not permission to write to the row it names. Rows for every
  // reader share one table, so a mismatch here is somebody else's book and
  // gets the same answer as a book that does not exist.
  if (!existing || existing.userId !== args.userId) {
    return { ok: false, reason: "notFound" };
  }

  const { promoteToRead } = readingProgressVerdict({
    pagesRead: args.pagesRead,
    totalPages: args.totalPages,
    shelf: existing.shelf,
  });

  await prisma.userBook.update({
    where: { id: args.userBookId },
    data: {
      pagesRead: args.pagesRead,
      totalPages: args.totalPages,
      progressUpdated: new Date(),
      ...(promoteToRead ? { shelf: "READ", finishedAt: new Date() } : {}),
    },
  });

  if (promoteToRead) {
    await settleDuelsForFinishedBook(args.userId, existing.bookId);
  }

  // Also called from a route handler, where this marks the paths stale for
  // their next visit rather than rebuilding them now. That is what we want:
  // progress saved on the phone should not leave the laptop showing page 210
  // of a book that is finished.
  revalidatePath("/books");
  revalidatePath("/dashboard");
  // A club page can show this reader's progress on the book it is reading.
  revalidatePath("/clubs", "layout");

  return { ok: true, promoted: promoteToRead };
}
