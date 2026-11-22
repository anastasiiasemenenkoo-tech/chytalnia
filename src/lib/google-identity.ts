/**
 * Who a Google sign-in is, and whether this app will let them in.
 *
 * Kept out of `auth.ts` and given its database as an argument so it can be
 * exercised on its own — the Google round trip itself needs somebody's real
 * Google password, so this decision is the only part that can be tested, and
 * it is the part that matters.
 */

/** The slice of Prisma this needs — a client or a transaction, either way. */
export type UserStore = {
  user: {
    // A union, not two optional keys: Prisma's `where` for a unique lookup
    // insists on being given exactly one of them, and a type with both
    // optional satisfies neither.
    findUnique(args: {
      where: { googleSub: string } | { email: string };
      select: { id: true; hashedPassword: true; googleSub: true };
    }): Promise<{
      id: string;
      hashedPassword: string | null;
      googleSub: string | null;
    } | null>;
    update(args: {
      where: { id: string };
      data: { googleSub?: string; name?: string };
      select: { id: true };
    }): Promise<{ id: string }>;
    create(args: {
      data: {
        email: string;
        name: string | null;
        googleSub: string;
        hashedPassword: null;
      };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
};

export type GoogleClaims = {
  /** Google's permanent id for this person. */
  sub: unknown;
  email: unknown;
  /** Google's own word on whether they have proved they read that mailbox. */
  emailVerified: unknown;
  name: unknown;
};

export type GoogleRefusal =
  /** Google would not vouch for the address, so it proves nothing. */
  | "google-email-unverified"
  /**
   * Somebody already holds this address with a password. It might be the
   * same person, and it might be someone who typed an address they do not
   * read — nothing here can tell those apart, so neither is let in.
   */
  | "google-account-has-password"
  /** The address is on an account belonging to a different Google id. */
  | "google-account-other";

export type GoogleOutcome =
  | { ok: true; userId: string }
  | { ok: false; reason: GoogleRefusal };

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Three ways in, and one of them is new:
 *
 * 1. **Known id** — this Google account has been here before. In, whatever
 *    address it now carries: a reader who changed their address in settings
 *    is still the same reader, and matching on the address would have made
 *    them a second account.
 * 2. **New address** — nobody holds it, so the account is created. Safe
 *    because Google has confirmed they read that mailbox.
 * 3. **An address held by a password-less account with no id yet** — the
 *    only thing that could have created such a row is this app's own Google
 *    sign-in, back when it matched on the address. Adopted, and the id is
 *    written down so it is matched properly from now on.
 *
 * Anything else is refused rather than guessed at.
 */
export async function resolveGoogleSignIn(
  db: UserStore,
  claims: GoogleClaims,
): Promise<GoogleOutcome> {
  const sub = text(claims.sub);
  const email = text(claims.email)?.toLowerCase() ?? null;
  const name = text(claims.name);

  // `email_verified` arrives as a boolean, but it is somebody else's JSON, so
  // only the exact true is taken for a yes.
  if (claims.emailVerified !== true || !sub || !email) {
    return { ok: false, reason: "google-email-unverified" };
  }

  const bySub = await db.user.findUnique({
    where: { googleSub: sub },
    select: { id: true, hashedPassword: true, googleSub: true },
  });
  if (bySub) return { ok: true, userId: bySub.id };

  const byEmail = await db.user.findUnique({
    where: { email },
    select: { id: true, hashedPassword: true, googleSub: true },
  });

  if (!byEmail) {
    const created = await db.user.create({
      data: { email, name, googleSub: sub, hashedPassword: null },
      select: { id: true },
    });
    return { ok: true, userId: created.id };
  }

  if (byEmail.hashedPassword !== null) {
    return { ok: false, reason: "google-account-has-password" };
  }
  if (byEmail.googleSub !== null) {
    // Password-less, but already spoken for by a different Google id.
    return { ok: false, reason: "google-account-other" };
  }

  await db.user.update({
    where: { id: byEmail.id },
    data: { googleSub: sub },
    select: { id: true },
  });
  return { ok: true, userId: byEmail.id };
}

/** The refusals this app knows how to explain on the login page. */
export const GOOGLE_REFUSALS: readonly GoogleRefusal[] = [
  "google-email-unverified",
  "google-account-has-password",
  "google-account-other",
];

export function isGoogleRefusal(value: unknown): value is GoogleRefusal {
  return (
    typeof value === "string" &&
    (GOOGLE_REFUSALS as readonly string[]).includes(value)
  );
}
