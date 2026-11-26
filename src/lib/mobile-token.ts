import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Bearer tokens for the iOS client.
 *
 * The web app signs people in with a cookie, and Auth.js is built around
 * that: the session lives in a `Set-Cookie` the browser replays on its own.
 * A native app has no cookie jar worth relying on, so it needs something it
 * can hold in the keychain and put in an `Authorization` header itself.
 *
 * This is deliberately *not* a JWT library. `jose` is in the tree, but only
 * as a dependency of `next-auth` — importing it directly would tie this file
 * to a package that a minor bump of Auth.js is free to drop. The format is
 * a payload and an HMAC over it, which is the useful half of a JWT in thirty
 * lines, with no algorithm field for an attacker to set to `none`.
 *
 * Everything here takes its secret as an argument and its clock as an
 * argument. That is what makes it testable without a server, a database or
 * a fixed system time — which is the whole reason the signing lives apart
 * from `mobile-auth.ts`.
 */

/** How long a token is good for. Long, because re-typing a password on a
 * phone keyboard is the thing people abandon an app over. */
export const MOBILE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type MobileTokenPayload = {
  /** The reader's id. Named `sub` so the shape stays familiar. */
  sub: string;
  /** Issued at, epoch milliseconds. */
  iat: number;
  /** Expires at, epoch milliseconds. */
  exp: number;
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(encodedPayload: string, secret: string): string {
  return base64url(createHmac("sha256", secret).update(encodedPayload).digest());
}

export function signMobileToken(args: {
  userId: string;
  secret: string;
  now?: number;
  ttlMs?: number;
}): string {
  const now = args.now ?? Date.now();
  const payload: MobileTokenPayload = {
    sub: args.userId,
    iat: now,
    exp: now + (args.ttlMs ?? MOBILE_TOKEN_TTL_MS),
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, args.secret)}`;
}

export type VerifyResult =
  | { ok: true; payload: MobileTokenPayload }
  | { ok: false; reason: "malformed" | "badSignature" | "expired" };

export function verifyMobileToken(args: {
  token: string;
  secret: string;
  now?: number;
}): VerifyResult {
  const parts = args.token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "malformed" };
  }

  const [encoded, provided] = parts;
  const expected = sign(encoded, args.secret);

  // Compared byte by byte in constant time. `===` on strings leaves early at
  // the first difference, and the timing of that tells a patient caller how
  // much of a forged signature was right — which is enough to build the rest
  // one character at a time.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "badSignature" };
  }

  // Only now is the payload worth reading: until the signature checked out,
  // every byte of it was the caller's to choose.
  let payload: MobileTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (
    typeof payload?.sub !== "string" ||
    !payload.sub ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }

  if ((args.now ?? Date.now()) >= payload.exp) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, payload };
}

/** The token out of an `Authorization: Bearer …` header, or null. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer (.+)$/.exec(header.trim());
  return match ? match[1].trim() : null;
}
