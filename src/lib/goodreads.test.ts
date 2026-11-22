import { describe, expect, it } from "vitest";

import {
  cleanIsbn,
  parseGoodreadsDate,
  readGoodreadsRows,
  type GoodreadsRow,
} from "@/lib/goodreads";

const NOW = new Date("2026-11-22T10:00:00.000Z");

/** A row with everything filled in; each test bends one field. */
function row(over: Partial<GoodreadsRow> = {}): GoodreadsRow {
  return {
    "Book Id": "123",
    Title: "Anxious People",
    Author: "Fredrik Backman",
    ISBN: '="1501160842"',
    ISBN13: '="9781501160844"',
    "My Rating": "5",
    "Number of Pages": "341",
    "Date Read": "2026/03/12",
    "Date Added": "2026/02/01",
    "Exclusive Shelf": "read",
    ...over,
  };
}

describe("cleanIsbn", () => {
  it("unwraps Goodreads' Excel quoting", () => {
    expect(cleanIsbn('="9781501160844"')).toBe("9781501160844");
  });

  it("keeps the X check digit of an ISBN-10", () => {
    expect(cleanIsbn('="043942089X"')).toBe("043942089X");
  });

  it("has nothing to say about an empty cell", () => {
    // Goodreads writes ="" for a book with no ISBN, which is most of them.
    expect(cleanIsbn('=""')).toBeNull();
    expect(cleanIsbn(undefined)).toBeNull();
  });
});

describe("parseGoodreadsDate", () => {
  it("reads a date as UTC, not as the server's zone", () => {
    // The bug this replaced: the same file landed on different days in dev
    // and on Vercel, because `new Date("2026/03/12")` is local time.
    expect(parseGoodreadsDate("2026/03/12")?.toISOString()).toBe(
      "2026-03-12T00:00:00.000Z",
    );
  });

  it("accepts single-digit months and days", () => {
    expect(parseGoodreadsDate("2011/9/5")?.toISOString()).toBe(
      "2011-09-05T00:00:00.000Z",
    );
  });

  it("returns nothing for an empty or unreadable cell", () => {
    expect(parseGoodreadsDate("")).toBeNull();
    expect(parseGoodreadsDate("not a date")).toBeNull();
  });
});

describe("readGoodreadsRows", () => {
  it("reads an ordinary finished book", () => {
    const { entries, skipped } = readGoodreadsRows([row()], NOW);
    expect(skipped).toBe(0);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      olid: "goodreads:123",
      title: "Anxious People",
      author: "Fredrik Backman",
      shelf: "READ",
      isbn: "9781501160844",
      totalPages: 341,
      rating: 5,
    });
    expect(entries[0].finishedAt?.toISOString()).toBe(
      "2026-03-12T00:00:00.000Z",
    );
  });

  it("puts Goodreads' own abandoned shelves on «Недочитано»", () => {
    // A reader can make their own exclusive shelf, and the one they make is
    // for books they put down. These used to be dropped silently.
    for (const shelf of ["did-not-finish", "dnf", "abandoned", "Gave-Up"]) {
      const { entries } = readGoodreadsRows(
        [row({ "Exclusive Shelf": shelf })],
        NOW,
      );
      expect(entries[0]?.shelf, shelf).toBe("ABANDONED");
    }
  });

  it("gives an unfinished book no finish date, whatever the file says", () => {
    const { entries } = readGoodreadsRows(
      [row({ "Exclusive Shelf": "currently-reading" })],
      NOW,
    );
    expect(entries[0].shelf).toBe("READING");
    expect(entries[0].finishedAt).toBeNull();
  });

  it("falls back to the date added when a read book has no date read", () => {
    const { entries } = readGoodreadsRows([row({ "Date Read": "" })], NOW);
    expect(entries[0].finishedAt?.toISOString()).toBe(
      "2026-02-01T00:00:00.000Z",
    );
  });

  it("keeps the first of two lines about one book", () => {
    const { entries, skipped } = readGoodreadsRows(
      [row({ "My Review": "перша" }), row({ "My Review": "друга" })],
      NOW,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].review).toBe("перша");
    expect(skipped).toBe(1);
  });

  it("skips a row with no shelf this app has, and counts it", () => {
    const { entries, skipped } = readGoodreadsRows(
      [row({ "Exclusive Shelf": "borrowed-from-mum" })],
      NOW,
    );
    expect(entries).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it("does not count a blank line as a skipped book", () => {
    const { entries, skipped } = readGoodreadsRows(
      [{ Title: "", "Book Id": "" }],
      NOW,
    );
    expect(entries).toHaveLength(0);
    expect(skipped).toBe(0);
  });

  it("treats a zero rating as no rating", () => {
    const { entries } = readGoodreadsRows([row({ "My Rating": "0" })], NOW);
    expect(entries[0].rating).toBeNull();
  });

  it("keeps Cyrillic titles and authors as they are", () => {
    const { entries } = readGoodreadsRows(
      [row({ Title: "Інтернат", Author: "Сергій Жадан" })],
      NOW,
    );
    expect(entries[0].title).toBe("Інтернат");
    expect(entries[0].author).toBe("Сергій Жадан");
  });
});
