import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const upsert = vi.fn();
const update = vi.fn();
const settle = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { userBook: { findUnique, upsert, update } },
}));
vi.mock("@/actions/duels", () => ({
  settleDuelsForFinishedBook: settle,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { applyReadingProgress, upsertUserBook } = await import(
  "@/lib/user-books"
);

const args = { userId: "u1", bookId: "b1" } as const;

/** What the upsert was told to write on an existing row. */
function written() {
  return upsert.mock.calls[0][0].update as { finishedAt: Date | null };
}

describe("upsertUserBook", () => {
  beforeEach(() => {
    findUnique.mockReset();
    upsert.mockReset().mockResolvedValue({ id: "ub1" });
    settle.mockReset();
  });

  it("keeps the date a book was actually finished on", async () => {
    // The bug: shelving a book you had already read — from a club, or a
    // second trip through search — stamped today over the real date, and the
    // year in review is built from that column.
    const realDate = new Date("2026-02-14T10:00:00.000Z");
    findUnique.mockResolvedValue({ finishedAt: realDate });

    await upsertUserBook({ ...args, shelf: "READ" });

    expect(written().finishedAt).toEqual(realDate);
  });

  it("stamps a book finished for the first time", async () => {
    findUnique.mockResolvedValue({ finishedAt: null });
    const before = Date.now();

    await upsertUserBook({ ...args, shelf: "READ" });

    const stamped = written().finishedAt;
    expect(stamped).toBeInstanceOf(Date);
    expect(stamped!.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("stamps a book that was not on any shelf yet", async () => {
    findUnique.mockResolvedValue(null);

    await upsertUserBook({ ...args, shelf: "READ" });

    expect(written().finishedAt).toBeInstanceOf(Date);
  });

  it("clears the date when the book leaves the read shelf", async () => {
    findUnique.mockResolvedValue({ finishedAt: new Date("2026-02-14") });

    for (const shelf of ["READING", "WANT_TO_READ", "ABANDONED"] as const) {
      upsert.mockClear();
      await upsertUserBook({ ...args, shelf });
      // Abandoned books must stay out of the yearly goal, which counts rows
      // with a finish date.
      expect(written().finishedAt).toBeNull();
    }
  });

  it("settles a duel only on a finish", async () => {
    findUnique.mockResolvedValue(null);

    await upsertUserBook({ ...args, shelf: "READ" });
    expect(settle).toHaveBeenCalledWith("u1", "b1");

    settle.mockClear();
    await upsertUserBook({ ...args, shelf: "READING" });
    expect(settle).not.toHaveBeenCalled();
  });
});

describe("applyReadingProgress", () => {
  const progress = {
    userId: "u1",
    userBookId: "ub1",
    pagesRead: 100,
    totalPages: 300,
  } as const;

  /** What the update was told to write. */
  function wrote() {
    return update.mock.calls[0][0].data as {
      pagesRead: number;
      totalPages: number;
      progressUpdated: Date;
      shelf?: string;
      finishedAt?: Date;
    };
  }

  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset().mockResolvedValue({ id: "ub1" });
    settle.mockReset();
  });

  it("will not write to another reader's row", async () => {
    // The whole point of the function taking a `userId`. Every reader's
    // shelves share one table, so a cuid from somewhere else would otherwise
    // be an edit to a stranger's book — and the phone sends ids straight
    // from a URL.
    findUnique.mockResolvedValue({
      userId: "someone-else",
      shelf: "READING",
      bookId: "b1",
    });

    const result = await applyReadingProgress(progress);

    expect(result).toEqual({ ok: false, reason: "notFound" });
    expect(update).not.toHaveBeenCalled();
  });

  it("answers a missing row exactly as it answers someone else's", async () => {
    // Same answer, so a caller probing ids learns nothing about which exist.
    findUnique.mockResolvedValue(null);

    expect(await applyReadingProgress(progress)).toEqual({
      ok: false,
      reason: "notFound",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("saves the page count part-way through and leaves the shelf alone", async () => {
    findUnique.mockResolvedValue({
      userId: "u1",
      shelf: "READING",
      bookId: "b1",
    });

    const result = await applyReadingProgress(progress);

    expect(result).toEqual({ ok: true, promoted: false });
    expect(wrote().pagesRead).toBe(100);
    expect(wrote().totalPages).toBe(300);
    expect(wrote().progressUpdated).toBeInstanceOf(Date);
    expect(wrote().shelf).toBeUndefined();
    expect(wrote().finishedAt).toBeUndefined();
    expect(settle).not.toHaveBeenCalled();
  });

  it("finishes a book read to its last page, and settles the duel", async () => {
    findUnique.mockResolvedValue({
      userId: "u1",
      shelf: "READING",
      bookId: "b1",
    });

    const result = await applyReadingProgress({ ...progress, pagesRead: 300 });

    expect(result).toEqual({ ok: true, promoted: true });
    expect(wrote().shelf).toBe("READ");
    expect(wrote().finishedAt).toBeInstanceOf(Date);
    // A duel is won by finishing the book, wherever that happens — which is
    // the reason this function exists instead of a second copy for mobile.
    expect(settle).toHaveBeenCalledWith("u1", "b1");
  });

  it("does not re-stamp a book already on the read shelf", async () => {
    findUnique.mockResolvedValue({ userId: "u1", shelf: "READ", bookId: "b1" });

    const result = await applyReadingProgress({ ...progress, pagesRead: 300 });

    // Correcting the page count of a finished book must not overwrite the
    // date it was finished on.
    expect(result).toEqual({ ok: true, promoted: false });
    expect(wrote().finishedAt).toBeUndefined();
    expect(settle).not.toHaveBeenCalled();
  });

  it("does not take a read book off its shelf when pages are corrected down", async () => {
    findUnique.mockResolvedValue({ userId: "u1", shelf: "READ", bookId: "b1" });

    await applyReadingProgress({ ...progress, pagesRead: 10 });

    expect(wrote().shelf).toBeUndefined();
    expect(wrote().finishedAt).toBeUndefined();
  });
});
