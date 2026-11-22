import "server-only";
import { headers } from "next/headers";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/**
 * How often one caller may do something before being told to wait.
 *
 * The thing being limited is always a pair: the account being named and the
 * machine doing the naming. Limiting by address alone lets one attacker work
 * through every account in the database; limiting by IP alone lets a
 * password be guessed from a thousand machines. Both are cheap, so both.
 */
export type Limit = {
  /** What is being counted — the prefix of the stored key. */
  bucket: string;
  /** The caller, within that bucket: an email, an IP, a user id. */
  subject: string;
  /** Attempts allowed inside one window. */
  max: number;
  windowMs: number;
};

export type Verdict =
  { ok: true } | { ok: false; retryAfterMs: number; retryAfterMinutes: number };

const ALLOWED: Verdict = { ok: true };

/**
 * When the counting itself fails, let the caller through.
 *
 * The other choice is to refuse everyone the moment the database hiccups —
 * which turns a slow query into an outage of the sign-in form. A limiter
 * exists to make guessing expensive, not to be the thing that decides
 * whether the app works at all. It is also what makes the order of a deploy
 * and its migration not matter: until the table exists, nothing is counted,
 * and the log says so.
 */
function failOpen(where: string, error: unknown): Verdict {
  console.error(`Rate limiting is not working (${where}):`, error);
  return ALLOWED;
}

function keyOf(limit: Limit) {
  return `${limit.bucket}:${limit.subject.toLowerCase()}`;
}

/**
 * How long to wait, built from the number of seconds **Postgres** says are
 * left rather than from a `Date` compared against this process's clock.
 *
 * That is the whole point: the first version of this file read `windowEnd`
 * back into a `Date` and compared it to `Date.now()`. The column had no time
 * zone, so the driver handed back a local time, and on a machine an hour off
 * UTC every live window looked expired — `peek` let everyone through and
 * refused nobody. One clock, and it is the database's.
 */
function refused(retryAfterSeconds: number): Verdict {
  const retryAfterMs = Math.max(0, retryAfterSeconds) * 1000;
  return {
    ok: false,
    retryAfterMs,
    // Rounded up, and never "0 minutes": being told to wait no time at all
    // while the door is shut reads as a broken app.
    retryAfterMinutes: Math.max(1, Math.ceil(retryAfterMs / 60_000)),
  };
}

/**
 * Seconds left in the window, as one SQL expression — so no timestamp ever
 * has to survive a trip through the driver to be compared.
 */
const SECONDS_LEFT = `GREATEST(0, CEIL(EXTRACT(EPOCH FROM ("windowEnd" - now()))))::int`;

/**
 * The caller's address, as the platform reports it.
 *
 * `x-forwarded-for` is a list the proxies append to, so the **first** entry
 * is the one Vercel saw; anything a client sends itself ends up after it.
 * Off a platform that sets it — `next dev` on this machine — there is no
 * address to have, and every local caller shares one bucket. That is the
 * right behaviour for a limiter: unknown callers are counted together rather
 * than each given a fresh allowance.
 */
export async function callerAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Has this caller used up its allowance? Read-only — nothing is counted.
 *
 * Used where only a *failure* should count against someone: a reader who
 * signs in correctly on the fourth try should not be a step closer to being
 * locked out than one who signs in correctly on the first.
 */
export async function peek(limits: Limit[]): Promise<Verdict> {
  try {
    for (const limit of limits) {
      // `windowEnd > now()` is part of the query, so a row coming back is a
      // live window by definition — an expired one is no window at all, and
      // the next write starts it again.
      const [row] = await prisma.$queryRaw<
        Array<{ count: number; retry_seconds: number }>
      >`
        SELECT "count", ${Prisma.raw(SECONDS_LEFT)} AS retry_seconds
        FROM "RateLimit"
        WHERE "key" = ${keyOf(limit)} AND "windowEnd" > now()
      `;
      if (!row) continue;
      if (row.count >= limit.max) return refused(row.retry_seconds);
    }
    return ALLOWED;
  } catch (error) {
    return failOpen("peek", error);
  }
}

/**
 * Count one attempt against every limit, and say whether it was allowed.
 *
 * One statement per limit, and the arithmetic happens in Postgres: two
 * requests arriving together would both read the same count and both write
 * `count + 1` if this were a read followed by a write, which is exactly the
 * burst a limiter exists to stop. The `CASE` is the window rolling over —
 * an expired row starts again at one rather than needing a sweep first.
 */
export async function consume(limits: Limit[]): Promise<Verdict> {
  let worst: Verdict = ALLOWED;

  try {
    for (const limit of limits) {
      const windowEnd = new Date(Date.now() + limit.windowMs);
      const [row] = await prisma.$queryRaw<
        Array<{ count: number; retry_seconds: number }>
      >`
        INSERT INTO "RateLimit" ("key", "count", "windowEnd")
        VALUES (${keyOf(limit)}, 1, ${windowEnd})
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE
            WHEN "RateLimit"."windowEnd" <= now() THEN 1
            ELSE "RateLimit"."count" + 1
          END,
          "windowEnd" = CASE
            WHEN "RateLimit"."windowEnd" <= now() THEN ${windowEnd}
            ELSE "RateLimit"."windowEnd"
          END
        RETURNING "count", ${Prisma.raw(SECONDS_LEFT)} AS retry_seconds
      `;

      if (row && row.count > limit.max && worst.ok) {
        worst = refused(row.retry_seconds);
      }
    }
  } catch (error) {
    return failOpen("consume", error);
  }

  void sweep();
  return worst;
}

/** Let a caller off the hook — called when they get it right. */
export async function forgive(limits: Limit[]): Promise<void> {
  try {
    for (const limit of limits) {
      await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "key" = ${keyOf(limit)}`;
    }
  } catch (error) {
    // Nothing to do about it, and never worth failing a sign-in that just
    // succeeded.
    failOpen("forgive", error);
  }
}

/**
 * Keys are made from whatever a caller types, so a run of invented addresses
 * is a run of rows. They stop counting the moment their window ends, so this
 * is only housekeeping — once in a hundred calls, and never in the way of
 * the answer the caller is waiting for.
 */
async function sweep(): Promise<void> {
  if (Math.random() >= 0.01) return;
  try {
    await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "windowEnd" < now() - interval '1 day'`;
  } catch {
    // Housekeeping is never worth failing a request over.
  }
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

/**
 * The limits themselves, in one place so they can be read as a policy rather
 * than found one call site at a time.
 *
 * Generous enough that no reader will meet them — ten wrong passwords in a
 * quarter of an hour is someone guessing, not someone typing — and tight
 * enough to make a dictionary attack pointless and to keep the password
 * reset form from being used as a mailing service at this app's expense.
 */
export const limits = {
  signIn: (email: string, address: string): Limit[] => [
    { bucket: "signin:email", subject: email, max: 10, windowMs: 15 * MINUTE },
    { bucket: "signin:addr", subject: address, max: 30, windowMs: 15 * MINUTE },
  ],
  signUp: (address: string): Limit[] => [
    { bucket: "signup:addr", subject: address, max: 5, windowMs: HOUR },
  ],
  passwordReset: (email: string, address: string): Limit[] => [
    // Each of these sends a letter, so the ceiling is also this app's email
    // quota.
    { bucket: "reset:email", subject: email, max: 3, windowMs: HOUR },
    { bucket: "reset:addr", subject: address, max: 10, windowMs: HOUR },
  ],
  passwordResetSubmit: (address: string): Limit[] => [
    { bucket: "resetsubmit:addr", subject: address, max: 20, windowMs: HOUR },
  ],
  emailChange: (userId: string): Limit[] => [
    // Two letters each: one to the new address, one telling the old.
    { bucket: "emailchange:user", subject: userId, max: 5, windowMs: HOUR },
  ],
} as const;
