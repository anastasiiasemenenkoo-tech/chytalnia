import { describe, expect, it } from "vitest";

import {
  bearerToken,
  signMobileToken,
  verifyMobileToken,
} from "@/lib/mobile-token";

const SECRET = "test-secret-not-the-real-one";
const OTHER_SECRET = "a-different-secret";

describe("mobile bearer tokens", () => {
  it("round-trips the reader's id", () => {
    const token = signMobileToken({ userId: "reader_123", secret: SECRET });
    const result = verifyMobileToken({ token, secret: SECRET });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload.sub).toBe("reader_123");
  });

  it("refuses a token signed with another secret", () => {
    // The case that matters on a rotated AUTH_SECRET: every old token has to
    // stop working, rather than being accepted because the payload parses.
    const token = signMobileToken({ userId: "reader_123", secret: OTHER_SECRET });
    const result = verifyMobileToken({ token, secret: SECRET });

    expect(result).toEqual({ ok: false, reason: "badSignature" });
  });

  it("refuses a payload edited to name someone else", () => {
    // The whole point of the signature. Swapping the payload for one that
    // says `sub: "victim"` has to fail even though it is valid JSON and the
    // signature is a real signature — just of different bytes.
    const mine = signMobileToken({ userId: "reader_123", secret: SECRET });
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "victim", iat: Date.now(), exp: Date.now() + 1000 }),
    )
      .toString("base64url")
      .replace(/=+$/, "");

    const forged = `${forgedPayload}.${mine.split(".")[1]}`;

    expect(verifyMobileToken({ token: forged, secret: SECRET }).ok).toBe(false);
  });

  it("refuses a token past its expiry", () => {
    const issued = 1_000_000;
    const token = signMobileToken({
      userId: "reader_123",
      secret: SECRET,
      now: issued,
      ttlMs: 60_000,
    });

    expect(
      verifyMobileToken({ token, secret: SECRET, now: issued + 59_999 }).ok,
    ).toBe(true);
    expect(
      verifyMobileToken({ token, secret: SECRET, now: issued + 60_000 }),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("calls nonsense malformed rather than throwing", () => {
    for (const token of ["", "nodot", "a.b.c", ".", "x."]) {
      expect(() =>
        verifyMobileToken({ token, secret: SECRET }),
      ).not.toThrow();
      expect(verifyMobileToken({ token, secret: SECRET }).ok).toBe(false);
    }
  });

  it("reads the token out of an Authorization header", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def");
    expect(bearerToken("  Bearer abc.def  ")).toBe("abc.def");
    expect(bearerToken("Basic abc.def")).toBeNull();
    expect(bearerToken("abc.def")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});
