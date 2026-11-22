import { describe, expect, it } from "vitest";

import { en } from "@/i18n/dictionaries/en";
import { uk } from "@/i18n/dictionaries/uk";
import { firstMessage } from "@/i18n/validation";
import {
  AddBookSchema,
  ClubCommentSchema,
  ClubScheduleSchema,
  CreateClubSchema,
  ManualAddBookSchema,
  NotesSchema,
  ReviewSchema,
  UpdateProgressSchema,
} from "@/lib/validators";

/**
 * Every message these schemas can produce has to exist in both dictionaries.
 * The bug this guards against is quiet: a rule written without a message, or
 * with a key nobody translated, falls through to Zod's own English — and the
 * reader sees "Too big: expected string to have <=500 characters" in the
 * middle of a Ukrainian page. `firstMessage` returning `validation.generic`
 * is the signature of exactly that.
 */
const cases: Array<{ name: string; parse: () => { success: boolean; error?: unknown }; fields?: string[] }> = [
  {
    name: "a book with no title",
    parse: () =>
      ManualAddBookSchema.safeParse({ title: "", author: "Хто", shelf: "READ" }),
    fields: ["title", "author", "shelf"],
  },
  {
    name: "a book with no author",
    parse: () =>
      ManualAddBookSchema.safeParse({ title: "Назва", author: "", shelf: "READ" }),
    fields: ["title", "author", "shelf"],
  },
  {
    name: "a title past the column's length",
    parse: () =>
      ManualAddBookSchema.safeParse({
        title: "т".repeat(301),
        author: "Хто",
        shelf: "READ",
      }),
    fields: ["title", "author", "shelf"],
  },
  {
    name: "a shelf that doesn't exist",
    parse: () =>
      ManualAddBookSchema.safeParse({
        title: "Назва",
        author: "Хто",
        shelf: "ON_THE_FLOOR",
      }),
    fields: ["title", "author", "shelf"],
  },
  {
    name: "a cover that is a javascript: URL",
    parse: () =>
      AddBookSchema.safeParse({
        olid: "OL1W",
        title: "Назва",
        author: "Хто",
        coverUrl: "javascript:alert(1)",
        shelf: "READ",
      }),
    fields: ["coverUrl"],
  },
  {
    name: "a club name of one letter",
    parse: () => CreateClubSchema.safeParse({ name: "К", description: "" }),
    fields: ["name", "description"],
  },
  {
    name: "a club description past 500",
    parse: () =>
      CreateClubSchema.safeParse({ name: "Клуб", description: "о".repeat(501) }),
    fields: ["name", "description"],
  },
  {
    name: "more pages read than the book has",
    parse: () =>
      UpdateProgressSchema.safeParse({
        userBookId: "ub1",
        pagesRead: "500",
        totalPages: "300",
      }),
    fields: ["pagesRead", "totalPages"],
  },
  {
    name: "a page count that isn't a number",
    parse: () =>
      UpdateProgressSchema.safeParse({
        userBookId: "ub1",
        pagesRead: "сто",
        totalPages: "300",
      }),
    fields: ["pagesRead", "totalPages"],
  },
  {
    name: "a book with no pages at all",
    parse: () =>
      UpdateProgressSchema.safeParse({
        userBookId: "ub1",
        pagesRead: "0",
        totalPages: "0",
      }),
    fields: ["pagesRead", "totalPages"],
  },
  {
    name: "a review past 2000 characters",
    parse: () =>
      ReviewSchema.safeParse({
        userBookId: "ub1",
        rating: "4",
        review: "д".repeat(2001),
      }),
    fields: ["rating", "review"],
  },
  {
    name: "six stars",
    parse: () => ReviewSchema.safeParse({ userBookId: "ub1", rating: "6" }),
    fields: ["rating", "review"],
  },
  {
    name: "notes past 4000 characters",
    parse: () =>
      NotesSchema.safeParse({ userBookId: "ub1", notes: "н".repeat(4001) }),
    fields: ["notes"],
  },
  {
    name: "an empty comment",
    parse: () => ClubCommentSchema.safeParse({ clubId: "c1", body: "   " }),
    fields: ["body"],
  },
  {
    name: "a comment past 2000 characters",
    parse: () =>
      ClubCommentSchema.safeParse({ clubId: "c1", body: "к".repeat(2001) }),
    fields: ["body"],
  },
  {
    name: "a deadline before the start",
    parse: () =>
      ClubScheduleSchema.safeParse({
        clubId: "c1",
        startDate: "2026-05-01",
        dueDate: "2026-04-01",
      }),
    fields: ["dueDate", "startDate"],
  },
  {
    name: "a date Postgres would choke on",
    parse: () =>
      ClubScheduleSchema.safeParse({
        clubId: "c1",
        startDate: "whenever",
        dueDate: "",
      }),
    fields: ["dueDate", "startDate"],
  },
];

describe("validation messages reach the reader translated", () => {
  for (const { name, parse, fields } of cases) {
    it(`${name} is a sentence, not a Zod default`, () => {
      const result = parse();
      expect(result.success, "the schema should have refused this").toBe(false);
      const error = (result as { error: Parameters<typeof firstMessage>[0] }).error;

      for (const dict of [uk, en]) {
        const message = firstMessage(error, dict, fields);
        expect(message).not.toBe(dict.validation.generic);
        expect(message.length).toBeGreaterThan(0);
      }
    });
  }
});

describe("the schedule still takes what the form sends", () => {
  it("accepts two empty dates", () => {
    expect(
      ClubScheduleSchema.safeParse({ clubId: "c1", startDate: "", dueDate: "" })
        .success,
    ).toBe(true);
  });

  it("accepts a start with no deadline", () => {
    expect(
      ClubScheduleSchema.safeParse({
        clubId: "c1",
        startDate: "2026-05-01",
        dueDate: "",
      }).success,
    ).toBe(true);
  });
});

describe("covers", () => {
  const book = {
    olid: "OL1W",
    title: "Назва",
    author: "Хто",
    shelf: "READ" as const,
  };

  it("takes an Open Library cover", () => {
    expect(
      AddBookSchema.safeParse({
        ...book,
        coverUrl: "https://covers.openlibrary.org/b/id/42-M.jpg",
      }).success,
    ).toBe(true);
  });

  it("takes no cover at all", () => {
    expect(AddBookSchema.safeParse({ ...book, coverUrl: "" }).success).toBe(true);
  });

  it("refuses a data: URL", () => {
    expect(
      AddBookSchema.safeParse({ ...book, coverUrl: "data:text/html,<script>" })
        .success,
    ).toBe(false);
  });
});
