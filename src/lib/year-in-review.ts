import "server-only";

import { prisma } from "@/lib/db";
import {
  summariseYear,
  type YearInReview,
} from "@/lib/year-summary";

export type { YearInReview } from "@/lib/year-summary";
export { summariseYear, type FinishedBook } from "@/lib/year-summary";

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

  return summariseYear(read, {
    year,
    finishedLastYear,
    setAside,
    goal: userRecord?.yearlyGoal ?? null,
  });
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
