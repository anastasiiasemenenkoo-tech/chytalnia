import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { issueMobileToken } from "@/lib/mobile-auth";
import {
  callerAddress,
  consume,
  forgive,
  limits,
} from "@/lib/rate-limit";
import { LoginSchema } from "@/lib/validators";

/**
 * Password sign-in for the iOS client.
 *
 * Auth.js's own `signIn` is not usable here: it answers by throwing a
 * redirect and setting a cookie, which is exactly right for a form post and
 * useless to an app that wants a token back as JSON. So this repeats the
 * credential check — the same bcrypt compare against the same named columns
 * as the `Credentials` provider in `src/auth.ts` — and mints a bearer token
 * instead of a session cookie.
 *
 * Rate limited through the same buckets as the web form, deliberately: an
 * attacker who finds this route should not get a fresh allowance of ten
 * guesses just by moving off the HTML page.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalidCredentials" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { email, password } = parsed.data;
  const attempt = limits.signIn(email, await callerAddress());

  const gate = await consume(attempt);
  if (!gate.ok) {
    return Response.json(
      { error: "tooManyAttempts", retryAfterMinutes: gate.retryAfterMinutes },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.ceil(gate.retryAfterMs / 1000)),
        },
      },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, yearlyGoal: true, hashedPassword: true },
  });

  // One answer for "no such reader", "that reader signed up with Google" and
  // "wrong password". Saying which would turn this route into a way to ask
  // whether an address has an account here.
  const ok =
    !!user?.hashedPassword &&
    (await bcrypt.compare(password, user.hashedPassword));

  if (!user || !ok) {
    return Response.json(
      { error: "invalidCredentials" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Wipe the slate so a reader who mistyped twice and then got it right is
  // not still carrying those two attempts around.
  await forgive(attempt);

  return Response.json(
    {
      token: issueMobileToken(user.id),
      reader: {
        id: user.id,
        email: user.email,
        name: user.name,
        yearlyGoal: user.yearlyGoal,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
