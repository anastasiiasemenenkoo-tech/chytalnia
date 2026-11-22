import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

const { shapeExport, EXPORT_FORMAT } = await import("@/lib/data-export");

const ME = "me";
const d = (iso: string) => new Date(iso);

/** One reader with something of everything, including the awkward bits. */
function rows() {
  return {
    user: {
      id: ME,
      email: "me@example.com",
      name: "Читачка",
      yearlyGoal: 24,
      createdAt: d("2026-01-02T10:00:00Z"),
      updatedAt: d("2026-11-01T10:00:00Z"),
      googleSub: "google-123",
      hashedPassword: "$2b$10$a-very-real-looking-hash",
    },
    books: [
      {
        shelf: "READ",
        addedAt: d("2026-02-01T10:00:00Z"),
        finishedAt: d("2026-03-01T10:00:00Z"),
        pagesRead: 320,
        totalPages: 320,
        progressUpdated: d("2026-03-01T09:00:00Z"),
        rating: 5,
        ratedAt: d("2026-03-01T11:00:00Z"),
        review: "Пробрало до кісток.",
        reviewUpdatedAt: d("2026-03-01T11:00:00Z"),
        notes: "На сторінці 40 — те, що треба переписати в щоденник.",
        notesUpdatedAt: d("2026-03-02T11:00:00Z"),
        book: { title: "Мої друзі", author: "Fredrik Backman", olid: "OL1W" },
      },
      {
        shelf: "WANT_TO_READ",
        addedAt: d("2026-04-01T10:00:00Z"),
        finishedAt: null,
        pagesRead: null,
        totalPages: null,
        progressUpdated: null,
        rating: null,
        ratedAt: null,
        review: null,
        reviewUpdatedAt: null,
        notes: null,
        notesUpdatedAt: null,
        book: { title: "Кобзар", author: "Тарас Шевченко", olid: "OL2W" },
      },
    ],
    clubs: [
      {
        role: "OWNER",
        joinedAt: d("2026-05-01T10:00:00Z"),
        club: { id: "c1", name: "Фантастика по суботах" },
      },
    ],
    following: [
      { createdAt: d("2026-06-01T10:00:00Z"), following: { name: "Олена" } },
    ],
    followers: [
      { createdAt: d("2026-06-02T10:00:00Z"), follower: { name: "Сергій" } },
    ],
    duels: [
      {
        status: "FINISHED",
        createdAt: d("2026-07-01T10:00:00Z"),
        respondedAt: d("2026-07-01T11:00:00Z"),
        wonAt: d("2026-07-10T11:00:00Z"),
        winnerId: ME,
        challengerId: ME,
        book: { title: "Мої друзі", author: "Fredrik Backman" },
        club: { name: "Фантастика по суботах" },
      },
      {
        status: "FINISHED",
        createdAt: d("2026-08-01T10:00:00Z"),
        respondedAt: d("2026-08-01T11:00:00Z"),
        wonAt: d("2026-08-10T11:00:00Z"),
        winnerId: "someone-else",
        challengerId: "someone-else",
        book: { title: "Кобзар", author: "Тарас Шевченко" },
        club: { name: "Фантастика по суботах" },
      },
    ],
    comments: [
      {
        body: "А мені фінал здався заслуженим.",
        createdAt: d("2026-09-01T10:00:00Z"),
        parentId: "parent-1",
        club: { name: "Фантастика по суботах" },
      },
    ],
    shares: [
      { year: 2026, token: "abc123", createdAt: d("2026-10-01T10:00:00Z") },
    ],
  } as unknown as Parameters<typeof shapeExport>[0];
}

describe("what the file must never contain", () => {
  it("does not carry the password fingerprint", () => {
    const text = JSON.stringify(shapeExport(rows(), ME));

    // The one thing in the reader's own row that must not leave the server.
    expect(text).not.toContain("$2b$10$");
    expect(text).not.toContain("hashedPassword");
  });

  it("does not carry Google's id for the reader", () => {
    const out = shapeExport(rows(), ME);

    expect(JSON.stringify(out)).not.toContain("google-123");
    // Whether, not which: that a Google account can sign in here is a fact
    // about this reader and worth telling them.
    expect(out.reader.signsInWithGoogle).toBe(true);
    expect(out.reader.signsInWithPassword).toBe(true);
  });

  it("does not carry another reader's address", () => {
    const text = JSON.stringify(shapeExport(rows(), ME));
    // A request from one reader is not consent from the rest.
    expect(text.match(/@example\.com/g)).toHaveLength(1);
  });

  it("gives a duel's other side no identity, only the outcome", () => {
    const out = shapeExport(rows(), ME);

    expect(JSON.stringify(out)).not.toContain("someone-else");
    expect(out.duels[0]).toMatchObject({ role: "challenger", outcome: "won" });
    expect(out.duels[1]).toMatchObject({ role: "opponent", outcome: "lost" });
  });
});

describe("what the file must contain", () => {
  it("carries the private notes, which are the point of asking", () => {
    const out = shapeExport(rows(), ME);

    expect(out.books[0].notes).toContain("щоденник");
    expect(out.books[0].review).toBe("Пробрало до кісток.");
  });

  it("carries every shelf, finished or not", () => {
    const out = shapeExport(rows(), ME);

    expect(out.books).toHaveLength(2);
    expect(out.books.map((b) => b.shelf)).toEqual(["READ", "WANT_TO_READ"]);
    expect(out.books[1].finishedAt).toBeNull();
  });

  it("carries clubs, follows, comments and public links", () => {
    const out = shapeExport(rows(), ME);

    expect(out.clubs[0]).toMatchObject({ name: "Фантастика по суботах", role: "OWNER" });
    expect(out.following[0].name).toBe("Олена");
    expect(out.followers[0].name).toBe("Сергій");
    expect(out.comments[0]).toMatchObject({ isReply: true });
    expect(out.publicYearLinks[0]).toMatchObject({
      year: 2026,
      url: "/y/abc123",
    });
  });

  it("writes dates as text a person and a machine can both read", () => {
    const out = shapeExport(rows(), ME);

    expect(out.books[0].finishedAt).toBe("2026-03-01T10:00:00.000Z");
    expect(out.reader.joinedAt).toBe("2026-01-02T10:00:00.000Z");
    expect(out.format).toBe(EXPORT_FORMAT);
  });

  it("survives a reader whose row has gone missing underneath it", () => {
    const empty = {
      user: null,
      books: [],
      clubs: [],
      following: [],
      followers: [],
      duels: [],
      comments: [],
      shares: [],
    } as unknown as Parameters<typeof shapeExport>[0];

    const out = shapeExport(empty, ME);

    expect(out.reader.email).toBeNull();
    expect(out.reader.signsInWithPassword).toBe(false);
    expect(out.books).toEqual([]);
  });
});
