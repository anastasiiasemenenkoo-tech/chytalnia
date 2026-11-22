import "server-only";

import { prisma } from "@/lib/db";

/**
 * Everything the database holds about one reader, as a file they can keep.
 *
 * Art. 15 and 20 GDPR: the right to know what is stored and to receive a
 * copy of it. Deleting an account was already possible; reading it back was
 * not, which made deletion the only way to find out what was in there.
 *
 * Two rules shape what goes in. **Everything about the reader, including the
 * parts the app never shows anyone else** — the private notes above all,
 * since those are the whole point of asking. And **nothing about anybody
 * else**: a club's other members, who wrote what in a discussion, the name
 * of whoever challenged them to a duel. Those are other people's data, and a
 * request from one reader is not consent from the rest. Where another person
 * is unavoidable — a duel has two sides — only their own role is recorded,
 * never their address.
 */

/** What the file says about the shape it is in, so a reader can tell. */
export const EXPORT_FORMAT = 1;

export type ReaderExport = ReturnType<typeof shapeExport>;

type Rows = Awaited<ReturnType<typeof collectRows>>;

async function collectRows(userId: string) {
  const [user, books, clubs, following, followers, duels, comments, shares] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          yearlyGoal: true,
          createdAt: true,
          updatedAt: true,
          googleSub: true,
          hashedPassword: true,
        },
      }),
      prisma.userBook.findMany({
        where: { userId },
        orderBy: { addedAt: "asc" },
        select: {
          shelf: true,
          addedAt: true,
          finishedAt: true,
          pagesRead: true,
          totalPages: true,
          progressUpdated: true,
          rating: true,
          ratedAt: true,
          review: true,
          reviewUpdatedAt: true,
          notes: true,
          notesUpdatedAt: true,
          book: { select: { title: true, author: true, olid: true } },
        },
      }),
      prisma.clubMembership.findMany({
        where: { userId },
        orderBy: { joinedAt: "asc" },
        select: {
          role: true,
          joinedAt: true,
          club: { select: { id: true, name: true } },
        },
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, following: { select: { name: true } } },
      }),
      prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, follower: { select: { name: true } } },
      }),
      prisma.readingDuel.findMany({
        where: { OR: [{ challengerId: userId }, { opponentId: userId }] },
        orderBy: { createdAt: "asc" },
        select: {
          status: true,
          createdAt: true,
          respondedAt: true,
          wonAt: true,
          winnerId: true,
          challengerId: true,
          book: { select: { title: true, author: true } },
          club: { select: { name: true } },
        },
      }),
      prisma.clubComment.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "asc" },
        select: {
          body: true,
          createdAt: true,
          parentId: true,
          club: { select: { name: true } },
        },
      }),
      prisma.yearShare.findMany({
        where: { userId },
        orderBy: { year: "asc" },
        select: { year: true, token: true, createdAt: true },
      }),
    ]);

  return { user, books, clubs, following, followers, duels, comments, shares };
}

/**
 * The rows, as the file. Separate from the queries so it can be tested
 * without a database — and so the one decision worth getting right is in
 * one place: a password fingerprint is about the reader, and it is also the
 * one thing that must never leave the server.
 */
export function shapeExport(rows: Rows, userId: string) {
  const { user } = rows;

  return {
    format: EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    reader: {
      id: userId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      yearlyGoal: user?.yearlyGoal ?? null,
      joinedAt: user?.createdAt?.toISOString() ?? null,
      lastChangedAt: user?.updatedAt?.toISOString() ?? null,
      // Whether, not which: that a Google account can sign in here is about
      // this reader; Google's id for them is not something they asked for
      // and not something worth copying around.
      signsInWithGoogle: user?.googleSub != null,
      signsInWithPassword: user?.hashedPassword != null,
    },
    books: rows.books.map((b) => ({
      title: b.book.title,
      author: b.book.author,
      openLibraryId: b.book.olid,
      shelf: b.shelf,
      addedAt: b.addedAt.toISOString(),
      finishedAt: b.finishedAt?.toISOString() ?? null,
      pagesRead: b.pagesRead,
      totalPages: b.totalPages,
      progressUpdatedAt: b.progressUpdated?.toISOString() ?? null,
      rating: b.rating,
      ratedAt: b.ratedAt?.toISOString() ?? null,
      review: b.review,
      reviewUpdatedAt: b.reviewUpdatedAt?.toISOString() ?? null,
      notes: b.notes,
      notesUpdatedAt: b.notesUpdatedAt?.toISOString() ?? null,
    })),
    clubs: rows.clubs.map((m) => ({
      name: m.club.name,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
    // Names, because that is what the reader chose to see here. No addresses:
    // somebody else's address is not this reader's to download.
    following: rows.following.map((f) => ({
      name: f.following.name,
      since: f.createdAt.toISOString(),
    })),
    followers: rows.followers.map((f) => ({
      name: f.follower.name,
      since: f.createdAt.toISOString(),
    })),
    duels: rows.duels.map((d) => ({
      book: d.book.title,
      author: d.book.author,
      club: d.club.name,
      // Their own side of it, not the other reader's identity.
      role: d.challengerId === userId ? "challenger" : "opponent",
      status: d.status,
      outcome:
        d.winnerId === null ? null : d.winnerId === userId ? "won" : "lost",
      startedAt: d.createdAt.toISOString(),
      answeredAt: d.respondedAt?.toISOString() ?? null,
      settledAt: d.wonAt?.toISOString() ?? null,
    })),
    comments: rows.comments.map((c) => ({
      club: c.club.name,
      body: c.body,
      isReply: c.parentId !== null,
      writtenAt: c.createdAt.toISOString(),
    })),
    publicYearLinks: rows.shares.map((s) => ({
      year: s.year,
      url: `/y/${s.token}`,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}

export async function exportReader(userId: string) {
  const rows = await collectRows(userId);
  return shapeExport(rows, userId);
}
