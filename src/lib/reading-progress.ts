import type { ShelfValue } from "@/lib/validators";

/**
 * What a new page count does to a book, decided apart from any database.
 *
 * Two surfaces now write progress — the web dialog and the phone — and the
 * rule they must agree on is not "save two numbers". Reaching the last page
 * moves the book to the read shelf and stamps it finished, which in turn
 * settles any duel over it. Get that wrong in one place only and a reader
 * finishes a book on their phone, wins nothing, and has no way to tell why.
 */
export type ProgressVerdict = {
  /** The book has been read to the end. */
  finished: boolean;
  /** …and it was not on the read shelf, so this update moves it there. */
  promoteToRead: boolean;
};

export function readingProgressVerdict(args: {
  pagesRead: number;
  totalPages: number;
  shelf: ShelfValue;
}): ProgressVerdict {
  // A book with no length is not a finished book. The validator keeps
  // `totalPages` at 1 or more, so this guard is for the callers it does not
  // cover — a 0/0 row would otherwise count as read to the end.
  const finished = args.totalPages > 0 && args.pagesRead >= args.totalPages;

  // Promotion goes one way. Correcting the page count of a book already on
  // the read shelf must not take it off: the finish date behind it is the
  // one thing here that cannot be recovered, and the year in review is
  // built from it.
  return { finished, promoteToRead: finished && args.shelf !== "READ" };
}
