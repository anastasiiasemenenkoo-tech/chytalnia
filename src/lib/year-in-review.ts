import "server-only";

import { prisma } from "@/lib/db";

/**
 * Everything a reader's year looks like, counted from what is already in the
 * database. No new columns: a finished book carries the date it was finished,
 * the pages it had and the stars it got, and that turns out to be enough.
 */
export type YearInReview = {
  year: number;
  /** Books moved to «Прочитане» with a finish date inside the year. */
  finished: number;
  /** Same for the year before, so the page can say whether it was more. */
  finishedLastYear: number;
  /** Pages, and how many books actually knew their own length. */
  pages: number;
  booksWithPages: number;
  /** One count per month, January first. */
  byMonth: number[];
  /** The month with the most books, when there is a clear one. */
  bestMonth: number | null;
  topAuthors: { author: string; count: number }[];
  /** How many books got 1★…5★ this year, index 0 is one star. */
  ratings: number[];
  averageRating: number | null;
  longest: { title: string; author: string; pages: number } | null;
  /** Read quickest, counted from the day it reached the shelves. */
  fastest: { title: string; author: string; days: number } | null;
  /** Books sitting on «Недочитано» right now — undated, so not year-bound. */
  setAside: number;
  goal: number | null;
};

/** Below this a "favourite author" is just the only author. */
const MIN_FOR_FAVOURITE = 2;

export async function yearInReview(
  userId: string,
  year: number,
): Promise<YearInReview> {
  // Local midnights: a book finished on 31 December belongs to that December
  // for the reader who wrote it down, whatever UTC thinks.
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const previousStart = new Date(year - 1, 0, 1);

  const [read, finishedLastYear, setAside, userRecord] = await Promise.all([
    prisma.userBook.findMany({
      where: {
        userId,
        shelf: "READ",
        finishedAt: { gte: start, lt: end },
      },
      select: {
        finishedAt: true,
        addedAt: true,
        totalPages: true,
        rating: true,
        book: { select: { title: true, author: true } },
      },
    }),
    prisma.userBook.count({
      where: {
        userId,
        shelf: "READ",
        finishedAt: { gte: previousStart, lt: start },
      },
    }),
    prisma.userBook.count({ where: { userId, shelf: "ABANDONED" } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { yearlyGoal: true },
    }),
  ]);

  const byMonth = new Array(12).fill(0) as number[];
  const authors = new Map<string, number>();
  const ratings = [0, 0, 0, 0, 0];

  let pages = 0;
  let booksWithPages = 0;
  let ratedCount = 0;
  let ratedTotal = 0;
  let longest: YearInReview["longest"] = null;
  let fastest: YearInReview["fastest"] = null;

  for (const entry of read) {
    if (entry.finishedAt) byMonth[entry.finishedAt.getMonth()]++;

    const author = entry.book.author.trim();
    if (author && author !== "Unknown") {
      authors.set(author, (authors.get(author) ?? 0) + 1);
    }

    if (entry.totalPages && entry.totalPages > 0) {
      pages += entry.totalPages;
      booksWithPages++;
      if (!longest || entry.totalPages > longest.pages) {
        longest = {
          title: entry.book.title,
          author: entry.book.author,
          pages: entry.totalPages,
        };
      }
    }

    if (entry.rating && entry.rating >= 1 && entry.rating <= 5) {
      ratings[entry.rating - 1]++;
      ratedCount++;
      ratedTotal += entry.rating;
    }

    // Imported books carry Goodreads' own "date added", so this is a real
    // number for a whole library and not just for books shelved here.
    if (entry.finishedAt && entry.addedAt) {
      const days = Math.round(
        (entry.finishedAt.getTime() - entry.addedAt.getTime()) / 86_400_000,
      );
      if (days >= 0 && (!fastest || days < fastest.days)) {
        fastest = {
          title: entry.book.title,
          author: entry.book.author,
          days,
        };
      }
    }
  }

  const peak = Math.max(...byMonth);
  // A tie is no winner: "your month was March, and also June" says nothing.
  const bestMonth =
    peak > 0 && byMonth.filter((n) => n === peak).length === 1
      ? byMonth.indexOf(peak)
      : null;

  const topAuthors = [...authors.entries()]
    .filter(([, count]) => count >= MIN_FOR_FAVOURITE)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([author, count]) => ({ author, count }));

  return {
    year,
    finished: read.length,
    finishedLastYear,
    pages,
    booksWithPages,
    byMonth,
    bestMonth,
    topAuthors,
    ratings,
    averageRating: ratedCount > 0 ? ratedTotal / ratedCount : null,
    longest,
    fastest,
    setAside,
    goal: userRecord?.yearlyGoal ?? null,
  };
}

/** What a shared link opens: whose year it is, and the year itself. */
export type SharedYear = { reader: string | null; review: YearInReview };

/**
 * Look up a year by the token in a shared link.
 *
 * Returns null for a token that was never issued or has since been revoked,
 * and the page turns that into a 404 — a link somebody took back should not
 * announce that it once existed.
 */
export async function yearByShareToken(
  token: string,
): Promise<SharedYear | null> {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 64) return null;

  const share = await prisma.yearShare.findUnique({
    where: { token: trimmed },
    select: { userId: true, year: true, user: { select: { name: true } } },
  });
  if (!share) return null;

  return {
    reader: share.user.name,
    review: await yearInReview(share.userId, share.year),
  };
}
