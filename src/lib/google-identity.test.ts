import { describe, expect, it } from "vitest";

import {
  isGoogleRefusal,
  resolveGoogleSignIn,
  type UserStore,
} from "@/lib/google-identity";

type Row = {
  id: string;
  email: string;
  hashedPassword: string | null;
  googleSub: string | null;
};

/** A `User` table small enough to read, with the writes recorded. */
function store(rows: Row[]) {
  const created: Array<Record<string, unknown>> = [];
  const updated: Array<{ id: string; data: Record<string, unknown> }> = [];
  let next = rows.length + 1;

  const db: UserStore = {
    user: {
      async findUnique({ where }) {
        const row =
          "googleSub" in where
            ? rows.find((r) => r.googleSub === where.googleSub)
            : rows.find((r) => r.email === where.email);
        return row
          ? {
              id: row.id,
              hashedPassword: row.hashedPassword,
              googleSub: row.googleSub,
            }
          : null;
      },
      async update({ where, data }) {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        updated.push({ id: where.id, data });
        return { id: where.id };
      },
      async create({ data }) {
        const row: Row = { id: `u${next++}`, ...data };
        rows.push(row);
        created.push(data);
        return { id: row.id };
      },
    },
  };
  return { db, rows, created, updated };
}

const google = {
  sub: "google-123",
  email: "reader@gmail.com",
  emailVerified: true,
  name: "Читачка",
};

describe("a Google sign-in nobody has seen", () => {
  it("gets a new account, with the id written down", async () => {
    const { db, created } = store([]);

    const out = await resolveGoogleSignIn(db, google);

    expect(out).toEqual({ ok: true, userId: "u1" });
    expect(created[0]).toMatchObject({
      email: "reader@gmail.com",
      googleSub: "google-123",
      hashedPassword: null,
    });
  });

  it("stores the address in lower case, as the rest of the app does", async () => {
    const { db, created } = store([]);
    await resolveGoogleSignIn(db, { ...google, email: "Reader@Gmail.COM" });
    expect(created[0].email).toBe("reader@gmail.com");
  });
});

describe("a Google account that has been here before", () => {
  it("is matched on the id, not the address", async () => {
    // The reader changed their address in settings. On the address this
    // would be a stranger, and they would quietly get a second account.
    const { db, created } = store([
      {
        id: "u1",
        email: "new-address@example.com",
        hashedPassword: null,
        googleSub: "google-123",
      },
    ]);

    const out = await resolveGoogleSignIn(db, google);

    expect(out).toEqual({ ok: true, userId: "u1" });
    expect(created).toHaveLength(0);
  });
});

describe("the hole this closes", () => {
  it("refuses an address somebody else registered with a password", async () => {
    // Sign-up sends no letter, so this row could have been made by anyone
    // typing an address they do not read. Letting Google in on a matching
    // address handed them whatever that person had put there — and the
    // person who made it still knows the password.
    const { db } = store([
      {
        id: "attacker",
        email: "reader@gmail.com",
        hashedPassword: "$2b$10$hash",
        googleSub: null,
      },
    ]);

    const out = await resolveGoogleSignIn(db, google);

    expect(out).toEqual({ ok: false, reason: "google-account-has-password" });
  });

  it("refuses an address already spoken for by another Google id", async () => {
    const { db } = store([
      {
        id: "someone",
        email: "reader@gmail.com",
        hashedPassword: null,
        googleSub: "google-999",
      },
    ]);

    const out = await resolveGoogleSignIn(db, google);

    expect(out).toEqual({ ok: false, reason: "google-account-other" });
  });

  it("refuses when Google will not vouch for the address", async () => {
    const { db, created } = store([]);

    const out = await resolveGoogleSignIn(db, {
      ...google,
      emailVerified: false,
    });

    expect(out).toEqual({ ok: false, reason: "google-email-unverified" });
    expect(created).toHaveLength(0);
  });

  it("takes only an exact true for verified", async () => {
    const { db } = store([]);
    for (const emailVerified of ["true", 1, {}, null, undefined]) {
      const out = await resolveGoogleSignIn(db, { ...google, emailVerified });
      expect(out).toEqual({ ok: false, reason: "google-email-unverified" });
    }
  });

  it("refuses claims with no id or no address", async () => {
    const { db } = store([]);
    expect(await resolveGoogleSignIn(db, { ...google, sub: "" })).toEqual({
      ok: false,
      reason: "google-email-unverified",
    });
    expect(await resolveGoogleSignIn(db, { ...google, email: null })).toEqual({
      ok: false,
      reason: "google-email-unverified",
    });
  });
});

describe("an account this app's own older Google sign-in made", () => {
  it("is adopted, and gets the id it never had", async () => {
    // Password-less with no id: only the Google sign-in that matched on the
    // address could have created such a row.
    const { db, updated } = store([
      {
        id: "u1",
        email: "reader@gmail.com",
        hashedPassword: null,
        googleSub: null,
      },
    ]);

    const out = await resolveGoogleSignIn(db, google);

    expect(out).toEqual({ ok: true, userId: "u1" });
    expect(updated).toEqual([{ id: "u1", data: { googleSub: "google-123" } }]);
  });

  it("is then matched on the id next time", async () => {
    const { db, updated } = store([
      {
        id: "u1",
        email: "reader@gmail.com",
        hashedPassword: null,
        googleSub: null,
      },
    ]);

    await resolveGoogleSignIn(db, google);
    const second = await resolveGoogleSignIn(db, google);

    expect(second).toEqual({ ok: true, userId: "u1" });
    expect(updated).toHaveLength(1);
  });
});

describe("isGoogleRefusal", () => {
  it("knows the reasons the login page can explain", () => {
    expect(isGoogleRefusal("google-account-has-password")).toBe(true);
    // Auth.js sends its own error names to this page too.
    expect(isGoogleRefusal("Configuration")).toBe(false);
    expect(isGoogleRefusal(undefined)).toBe(false);
  });
});
