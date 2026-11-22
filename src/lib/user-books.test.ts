import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const upsert = vi.fn();
const settle = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { userBook: { findUnique, upsert } },
}));
vi.mock("@/actions/duels", () => ({
  settleDuelsForFinishedBook: settle,
}));

const { upsertUserBook } = await import("@/lib/user-books");

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
