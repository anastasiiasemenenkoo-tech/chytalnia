import "server-only";

import { prisma } from "@/lib/db";
import { bearerToken, signMobileToken, verifyMobileToken } from "@/lib/mobile-token";

/**
 * Who is calling one of the `/api/mobile/*` handlers.
 *
 * The signing itself lives in `mobile-token.ts`, which knows nothing about
 * requests or Prisma. This is the half that cannot be unit tested: the
 * environment and the database.
 */

function secret(): string {
  const value = process.env.AUTH_SECRET;
  // The same secret the web session is signed with. Missing, the right
  // answer is to refuse everything loudly rather than sign tokens with
  // `undefined` and hand out forgeable sessions.
  if (!value) throw new Error("AUTH_SECRET is not set.");
  return value;
}

export function issueMobileToken(userId: string) {
  return signMobileToken({ userId, secret: secret() });
}

export type MobileReader = {
  id: string;
  email: string;
  name: string | null;
  yearlyGoal: number | null;
};

/**
 * The reader behind a Bearer token, or null.
 *
 * Returns null for every kind of failure — no signature, bad signature,
 * expired, or a token naming a reader who has since deleted their account.
 * The caller answers all of those with a flat 401: telling a stranger which
 * of the four it was is free information about whose tokens exist.
 */
export async function mobileReader(
  request: Request,
): Promise<MobileReader | null> {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;

  const result = verifyMobileToken({ token, secret: secret() });
  if (!result.ok) return null;

  // Named columns, not the whole row — the rule the rest of this codebase
  // follows, and the reason adding a column to `User` cannot take mobile
  // sign-in down the way it once took the password one down.
  return prisma.user.findUnique({
    where: { id: result.payload.sub },
    select: { id: true, email: true, name: true, yearlyGoal: true },
  });
}

/** `{ reader }` or `{ response }` — the 401 the handler should return. */
export async function requireMobileReader(
  request: Request,
): Promise<{ reader: MobileReader } | { response: Response }> {
  const reader = await mobileReader(request);
  if (!reader) {
    return {
      response: Response.json(
        { error: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }
  return { reader };
}
