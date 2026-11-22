import { describe, expect, it } from "vitest";

import { summariseYear, type FinishedBook } from "@/lib/year-summary";

const CONTEXT = {
  year: 2026,
  finishedLastYear: 3,
  setAside: 1,
  goal: 15 as number | null,
};

function book(over: Partial<FinishedBook> & { finished?: string } = {}) {
  const { finished, ...rest } = over;
  return {
    finishedAt: finished ? new Date(`${finished}T00:00:00.000Z`) : null,
    addedAt: new Date("2026-01-01T00:00:00.000Z"),
    totalPages: 300,
    rating: 4,
    book: { title: "A Book", author: "An Author" },
    ...rest,
  } satisfies FinishedBook;
}

describe("summariseYear", () => {
  it("counts books and pages", () => {
    const year = summariseYear(
      [
        book({ finished: "2026-01-10", totalPages: 100 }),
        book({ finished: "2026-02-10", totalPages: 250 }),
      ],
      CONTEXT,
    );
    expect(year.finished).toBe(2);
    expect(year.pages).toBe(350);
    expect(year.booksWithPages).toBe(2);
  });

  it("counts only the books that know their own length", () => {
    const year = summariseYear(
      [
        book({ finished: "2026-01-10", totalPages: 100 }),
        book({ finished: "2026-02-10", totalPages: null }),
      ],
      CONTEXT,
    );
    expect(year.finished).toBe(2);
    expect(year.booksWithPages).toBe(1);
    expect(year.pages).toBe(100);
  });

  it("buckets books by the month they were finished", () => {
    const year = summariseYear(
      [
        book({ finished: "2026-01-10" }),
        book({ finished: "2026-03-01" }),
        book({ finished: "2026-03-31" }),
      ],
      CONTEXT,
    );
    expect(year.byMonth[0]).toBe(1);
    expect(year.byMonth[2]).toBe(2);
    expect(year.byMonth[11]).toBe(0);
    expect(year.bestMonth).toBe(2);
  });

  it("names no best month when two months tie", () => {
    // Saying «your month was March, and also June» says nothing, and the
    // page leaves the sentence out rather than claiming the year was even.
    const year = summariseYear(
      [book({ finished: "2026-03-01" }), book({ finished: "2026-06-01" })],
      CONTEXT,
    );
    expect(year.bestMonth).toBeNull();
  });

  it("needs two books before an author is a favourite", () => {
    const year = summariseYear(
      [
        book({ finished: "2026-01-01", book: { title: "A", author: "Two Timer" } }),
        book({ finished: "2026-02-01", book: { title: "B", author: "Two Timer" } }),
        book({ finished: "2026-03-01", book: { title: "C", author: "Once Only" } }),
      ],
      CONTEXT,
    );
    expect(year.topAuthors).toEqual([{ author: "Two Timer", count: 2 }]);
  });

  it("leaves «Unknown» out of the favourites", () => {
    // That is what the import writes for a book with no author, and a shelf
    // full of them should not crown nobody as the author of the year.
    const year = summariseYear(
      [
        book({ finished: "2026-01-01", book: { title: "A", author: "Unknown" } }),
        book({ finished: "2026-02-01", book: { title: "B", author: "Unknown" } }),
      ],
      CONTEXT,
    );
    expect(year.topAuthors).toEqual([]);
  });

  it("finds the thickest book and the one read quickest", () => {
    const year = summariseYear(
      [
        book({
          finished: "2026-01-20",
          totalPages: 900,
          book: { title: "Thick", author: "A" },
        }),
        book({
          finished: "2026-01-03",
          addedAt: new Date("2026-01-01T00:00:00.000Z"),
          totalPages: 100,
          book: { title: "Quick", author: "B" },
        }),
      ],
      CONTEXT,
    );
    expect(year.longest?.title).toBe("Thick");
    expect(year.fastest?.title).toBe("Quick");
    expect(year.fastest?.days).toBe(2);
  });

  it("ignores a finish date that falls before the book was added", () => {
    // Imported libraries carry Goodreads' own dates, and some of them are
    // nonsense. A negative «days on the shelf» is not a record.
    const year = summariseYear(
      [
        book({
          finished: "2026-01-01",
          addedAt: new Date("2026-05-01T00:00:00.000Z"),
        }),
      ],
      CONTEXT,
    );
    expect(year.fastest).toBeNull();
  });

  it("averages only the books that were rated", () => {
    const year = summariseYear(
      [
        book({ finished: "2026-01-01", rating: 5 }),
        book({ finished: "2026-02-01", rating: 4 }),
        book({ finished: "2026-03-01", rating: null }),
      ],
      CONTEXT,
    );
    expect(year.ratings).toEqual([0, 0, 0, 1, 1]);
    expect(year.averageRating).toBe(4.5);
  });

  it("has no average when nothing was rated", () => {
    const year = summariseYear(
      [book({ finished: "2026-01-01", rating: null })],
      CONTEXT,
    );
    expect(year.averageRating).toBeNull();
  });

  it("survives a year with nothing in it", () => {
    const year = summariseYear([], CONTEXT);
    expect(year.finished).toBe(0);
    expect(year.pages).toBe(0);
    expect(year.bestMonth).toBeNull();
    expect(year.longest).toBeNull();
    expect(year.byMonth).toHaveLength(12);
  });
});
