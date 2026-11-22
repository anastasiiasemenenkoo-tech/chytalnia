import type { ShelfValue } from "@/lib/validators";

/**
 * Reading a Goodreads export, with nothing in it that touches a network or
 * a database.
 *
 * It lives apart from the action that imports it because this is the part
 * that was wrong: dates read in the server's zone, ISBNs still wrapped in
 * Excel's quoting, whole shelves of abandoned books dropped. All of that is
 * decided here, from a row and nothing else, so it can be tested in
 * milliseconds instead of by clicking a CSV through a browser.
 */

export type GoodreadsRow = {
  "Book Id"?: string;
  Title?: string;
  Author?: string;
  ISBN?: string;
  ISBN13?: string;
  "My Rating"?: string;
  "Number of Pages"?: string;
  "Date Read"?: string;
  "Date Added"?: string;
  "Exclusive Shelf"?: string;
  "My Review"?: string;
  "Private Notes"?: string;
};

/** One row of the file, already read and judged importable. */
export type GoodreadsEntry = {
  olid: string;
  title: string;
  author: string;
  shelf: ShelfValue;
  isbn: string | null;
  totalPages: number | null;
  rating: number | null;
  addedAt: Date;
  finishedAt: Date | null;
  stampedAt: Date;
  review: string | null;
  notes: string | null;
};

const SHELF_MAP: Record<string, ShelfValue> = {
  read: "READ",
  "currently-reading": "READING",
  "to-read": "WANT_TO_READ",
  // Goodreads lets a reader mark a shelf of their own as exclusive, and the
  // one people make is almost always for books they put down. These are the
  // names they give it; without them those books vanish from the import.
  "did-not-finish": "ABANDONED",
  "did-not-finish-dnf": "ABANDONED",
  dnf: "ABANDONED",
  abandoned: "ABANDONED",
  unfinished: "ABANDONED",
  "gave-up": "ABANDONED",
};

// Goodreads wraps ISBN cells like ="9781234567890" so Excel treats them as
// text rather than numbers — strip that down to the digits (and trailing X
// for ISBN-10 check digits).
export function cleanIsbn(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d{9,13}X?)/);
  return match ? match[1] : null;
}

/**
 * Goodreads writes dates as YYYY/MM/DD with no time and no zone. Handing
 * that to `new Date` reads it in whatever zone the server happens to run in,
 * so the same file would land on different days in dev and on Vercel. Pin it
 * to UTC midnight and the date a reader sees is the date they exported.
 */
export function parseGoodreadsDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const ymd = raw.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) {
    return new Date(
      Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])),
    );
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function positiveInt(raw: string | undefined): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Turn parsed CSV rows into the books worth importing.
 *
 * A row counts if it names a book, carries an id to key it by, and sits on a
 * shelf this app has. Everything else is counted as skipped and left alone.
 *
 * `now` is an argument so the result is the same on every run: rows with no
 * dates of their own fall back to it.
 */
export function readGoodreadsRows(
  rows: GoodreadsRow[],
  now: Date = new Date(),
): { entries: GoodreadsEntry[]; skipped: number } {
  const byOlid = new Map<string, GoodreadsEntry>();
  let skipped = 0;

  for (const row of rows) {
    const title = row.Title?.trim();
    const bookId = row["Book Id"]?.trim();
    const shelf = SHELF_MAP[row["Exclusive Shelf"]?.trim().toLowerCase() ?? ""];
    if (!title || !bookId || !shelf) {
      // A blank line is not a skipped book; a book this app has no shelf for
      // is. Only rows that look like they meant something are counted.
      if (title || bookId) skipped++;
      continue;
    }

    const olid = `goodreads:${bookId}`;
    // Goodreads does not repeat a book, but a hand-edited file can. The
    // first line wins; a later one would only overwrite it with less.
    if (byOlid.has(olid)) {
      skipped++;
      continue;
    }

    const dateAdded = parseGoodreadsDate(row["Date Added"]);
    const dateRead = parseGoodreadsDate(row["Date Read"]);
    const rating = positiveInt(row["My Rating"]);

    byOlid.set(olid, {
      olid,
      title,
      author: row.Author?.trim() || "Unknown",
      shelf,
      isbn: cleanIsbn(row.ISBN13) ?? cleanIsbn(row.ISBN),
      totalPages: positiveInt(row["Number of Pages"]),
      rating,
      addedAt: dateAdded ?? now,
      finishedAt: shelf === "READ" ? (dateRead ?? dateAdded) : null,
      stampedAt: dateRead ?? dateAdded ?? now,
      review: row["My Review"]?.trim() || null,
      notes: row["Private Notes"]?.trim() || null,
    });
  }

  return { entries: [...byOlid.values()], skipped };
}
