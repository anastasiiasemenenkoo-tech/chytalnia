import { describe, expect, it } from "vitest";

import { readingProgressVerdict } from "@/lib/reading-progress";

describe("readingProgressVerdict", () => {
  it("is unfinished part-way through", () => {
    expect(
      readingProgressVerdict({ pagesRead: 210, totalPages: 464, shelf: "READING" }),
    ).toEqual({ finished: false, promoteToRead: false });
  });

  it("promotes a book read to its last page", () => {
    expect(
      readingProgressVerdict({ pagesRead: 464, totalPages: 464, shelf: "READING" }),
    ).toEqual({ finished: true, promoteToRead: true });
  });

  it("counts a page count past the end as finished", () => {
    // The web form refuses this, but a second client need not, and "more
    // than the whole book" is still a finished book.
    expect(
      readingProgressVerdict({ pagesRead: 500, totalPages: 464, shelf: "READING" }),
    ).toEqual({ finished: true, promoteToRead: true });
  });

  it("does not promote a book already on the read shelf", () => {
    // Finished, but there is nothing to move: promoting again would stamp a
    // fresh finish date over the real one.
    expect(
      readingProgressVerdict({ pagesRead: 464, totalPages: 464, shelf: "READ" }),
    ).toEqual({ finished: true, promoteToRead: false });
  });

  it("never demotes a read book whose page count is corrected downwards", () => {
    expect(
      readingProgressVerdict({ pagesRead: 100, totalPages: 464, shelf: "READ" }),
    ).toEqual({ finished: false, promoteToRead: false });
  });

  it("promotes an abandoned book that was finished after all", () => {
    expect(
      readingProgressVerdict({ pagesRead: 300, totalPages: 300, shelf: "ABANDONED" }),
    ).toEqual({ finished: true, promoteToRead: true });
  });

  it("treats a book of no length as unfinished", () => {
    expect(
      readingProgressVerdict({ pagesRead: 0, totalPages: 0, shelf: "READING" }),
    ).toEqual({ finished: false, promoteToRead: false });
  });
});
