"use server";

import Papa from "papaparse";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { type GoodreadsRow, readGoodreadsRows } from "@/lib/goodreads";


/**
 * Covers are the slow part — one Open Library request per book — and a long
 * library would blow the function's time limit before a single row was
 * written. After this much time the rest of the books come in without covers
 * rather than not at all.
 */
const COVER_BUDGET_MS = 25_000;
const COVER_CONCURRENCY = 8;
/**
 * How many rows go to the database at once. Prisma's `$transaction([...])`
 * is not one round trip — it sends BEGIN, every statement and COMMIT in turn
 * — so fifty upserts of a bulk import ran past its five-second transaction
 * limit and the whole thing died with P2028. These go in parallel instead:
 * the import is no longer atomic, which is the right trade for a file that
 * can simply be sent again.
 */
const WRITE_CONCURRENCY = 10;
/** `createMany` really is one statement, so it can take a bigger bite. */
const CREATE_CHUNK = 100;

export type GoodreadsImportState =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; error: string }
  | undefined;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function fetchCoverByIsbn(isbn: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      {
        headers: { "User-Agent": "reader-dashboard (learning project)" },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<
      string,
      { cover?: { medium?: string; large?: string } }
    >;
    const entry = data[`ISBN:${isbn}`];
    return entry?.cover?.medium ?? entry?.cover?.large ?? null;
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

export async function importGoodreadsCsv(
  _prev: GoodreadsImportState,
  formData: FormData,
): Promise<GoodreadsImportState> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: dict.books.importNoFile };
  }

  const text = await file.text();
  const parsed = Papa.parse<GoodreadsRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const { entries, skipped: unusable } = readGoodreadsRows(parsed.data);
  let skipped = unusable;

  if (entries.length === 0) {
    return { ok: false, error: dict.books.importEmpty };
  }

  // What is already on the shelves of this app, from an earlier import or
  // from somebody else's. Books found here need neither a row nor a cover.
  const known = new Map<string, { id: string; coverUrl: string | null }>();
  for (const part of chunk(entries.map((e) => e.olid), 500)) {
    const found = await prisma.book.findMany({
      where: { olid: { in: part } },
      select: { id: true, olid: true, coverUrl: true },
    });
    for (const b of found) known.set(b.olid, { id: b.id, coverUrl: b.coverUrl });
  }

  const needCover = entries.filter(
    (e) => e.isbn && !known.get(e.olid)?.coverUrl,
  );
  const deadline = Date.now() + COVER_BUDGET_MS;
  const covers = new Map<string, string>();
  await mapWithConcurrency(needCover, COVER_CONCURRENCY, async (entry) => {
    if (Date.now() > deadline) return;
    const url = await fetchCoverByIsbn(entry.isbn!);
    if (url) covers.set(entry.olid, url);
  });

  // Books nobody has yet, written in batches rather than one at a time: a
  // library of five hundred would otherwise be five hundred round trips to
  // Neon before the first shelf appeared.
  const fresh = entries.filter((e) => !known.has(e.olid));
  for (const part of chunk(fresh, CREATE_CHUNK)) {
    await prisma.book.createMany({
      data: part.map((e) => ({
        olid: e.olid,
        title: e.title,
        author: e.author,
        coverUrl: covers.get(e.olid) ?? null,
      })),
      skipDuplicates: true,
    });
  }
  if (fresh.length > 0) {
    for (const part of chunk(fresh.map((e) => e.olid), 500)) {
      const found = await prisma.book.findMany({
        where: { olid: { in: part } },
        select: { id: true, olid: true, coverUrl: true },
      });
      for (const b of found)
        known.set(b.olid, { id: b.id, coverUrl: b.coverUrl });
    }
  }

  // A book that was already here without a picture can have one now. Title
  // and author are left alone: that row is shared with every other reader,
  // and one person's export has no business rewriting it.
  const fillCover = entries.filter(
    (e) => covers.has(e.olid) && !known.get(e.olid)?.coverUrl,
  );
  await mapWithConcurrency(fillCover, WRITE_CONCURRENCY, (e) =>
    prisma.book.update({
      where: { olid: e.olid },
      data: { coverUrl: covers.get(e.olid)! },
    }),
  );

  let imported = 0;
  await mapWithConcurrency(entries, WRITE_CONCURRENCY, async (e) => {
    const bookId = known.get(e.olid)?.id;
    if (!bookId) {
      skipped++;
      return;
    }
    await prisma.userBook.upsert({
      where: { userId_bookId: { userId: user.id, bookId } },
      // Only what Goodreads actually carries. The old version wrote every
      // field every time, so importing the same file twice erased the
      // reviews, ratings and notes written here — Goodreads has none for
      // those books, and null overwrote them.
      update: {
        shelf: e.shelf,
        ...(e.finishedAt ? { finishedAt: e.finishedAt } : {}),
        ...(e.totalPages ? { totalPages: e.totalPages } : {}),
        ...(e.rating ? { rating: e.rating, ratedAt: e.stampedAt } : {}),
        ...(e.review ? { review: e.review, reviewUpdatedAt: e.stampedAt } : {}),
        ...(e.notes ? { notes: e.notes, notesUpdatedAt: new Date() } : {}),
      },
      create: {
        userId: user.id,
        bookId,
        shelf: e.shelf,
        addedAt: e.addedAt,
        finishedAt: e.finishedAt,
        totalPages: e.totalPages,
        rating: e.rating,
        ratedAt: e.rating ? e.stampedAt : null,
        review: e.review,
        reviewUpdatedAt: e.review ? e.stampedAt : null,
        notes: e.notes,
        notesUpdatedAt: e.notes ? new Date() : null,
      },
    });
    imported++;
  });

  revalidatePath("/books");
  revalidatePath("/dashboard");
  return { ok: true, imported, skipped };
}
