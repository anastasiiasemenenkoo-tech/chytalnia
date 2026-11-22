"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/auth";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { sendEmail } from "@/lib/mailer";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db";
import {
  callerAddress,
  consume,
  forgive,
  limits,
  peek,
} from "@/lib/rate-limit";
import { safePath } from "@/lib/safe-path";
import { requireCurrentUser } from "@/lib/session";
import { createToken, hashToken, TOKEN_TTL_MS } from "@/lib/tokens";
import {
  LoginSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  SignupSchema,
  YearlyGoalSchema,
} from "@/lib/validators";
import type { ActionResult } from "@/actions/books";

export type AuthFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
        passwordConfirm?: string[];
        name?: string[];
        _form?: string[];
      };
      // Echoed back so a failed submit doesn't wipe what the user typed.
      // Passwords are deliberately left out — they'd end up in the HTML payload.
      values?: { email?: string; name?: string };
    }
  | undefined;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

type ValidationDict = Awaited<
  ReturnType<typeof getDictionary>
>["auth"]["validation"];

// The auth schemas emit dictionary keys instead of prose (see validators.ts);
// swap them for the current locale, leaving anything unrecognised as-is.
function localize<T extends Record<string, string[] | undefined>>(
  fieldErrors: T,
  validation: ValidationDict,
): T {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [
      field,
      messages?.map((m) => validation[m as keyof ValidationDict] ?? m),
    ]),
  ) as T;
}

/** Postgres' unique-constraint failure, as Prisma reports it. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { email: text(formData, "email"), name: text(formData, "name") };

  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });

  if (!parsed.success) {
    const dict = await getDictionary();
    return {
      errors: localize(parsed.error.flatten().fieldErrors, dict.auth.validation),
      values,
    };
  }

  const { email, name, password } = parsed.data;
  // Where they were going before they were asked to sign in. An invite link
  // is the usual reason someone signs up at all.
  const next = safePath(formData.get("next")) ?? "/dashboard";

  const dict = await getDictionary();

  // Counted before the row is written: an open sign-up form is how a
  // database fills with accounts nobody asked for.
  const gate = await consume(limits.signUp(await callerAddress()));
  if (!gate.ok) {
    return {
      errors: {
        _form: [
          interpolate(dict.auth.tooManySignups, {
            minutes: gate.retryAfterMinutes,
          }),
        ],
      },
      values,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { errors: { email: [dict.auth.emailTaken] }, values };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({ data: { email, name, hashedPassword } });
  } catch (error) {
    // `email` is unique, and the check above is a different statement from
    // this one: two people signing up with the same address in the same
    // second both pass it, and the loser used to get the crash page instead
    // of "that address is taken".
    if (isUniqueViolation(error)) {
      return { errors: { email: [dict.auth.emailTaken] }, values };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: next,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { errors: { _form: [dict.auth.couldNotSignIn] }, values };
    }
    throw error;
  }
  return undefined;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { email: text(formData, "email") };
  const next = safePath(formData.get("next")) ?? "/dashboard";

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const dict = await getDictionary();
    return {
      errors: localize(parsed.error.flatten().fieldErrors, dict.auth.validation),
      values,
    };
  }

  // Asked, not counted: only a wrong password counts against someone, so a
  // reader who gets it right on the fourth try is no closer to a locked door
  // than one who gets it right on the first.
  const attempt = limits.signIn(parsed.data.email, await callerAddress());
  const gate = await peek(attempt);
  if (!gate.ok) {
    const dict = await getDictionary();
    return {
      errors: {
        _form: [
          interpolate(dict.auth.tooManyAttempts, {
            minutes: gate.retryAfterMinutes,
          }),
        ],
      },
      values,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: next,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await consume(attempt);
      const dict = await getDictionary();
      // Still says nothing about which half was wrong, or whether the
      // address is one this app knows.
      return { errors: { _form: [dict.auth.invalidCreds] }, values };
    }
    // A success leaves through here too — `signIn` redirects by throwing —
    // so the slate is wiped on the way out.
    await forgive(attempt);
    throw error;
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function signInWithGoogleAction(formData?: FormData) {
  const next = safePath(formData?.get("next")) ?? "/dashboard";
  await signIn("google", { redirectTo: next });
}

export type ForgotPasswordState =
  | {
      errors?: { email?: string[] };
      sent?: boolean;
      values?: { email?: string };
    }
  | undefined;

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = RequestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    const dict = await getDictionary();
    return {
      errors: localize(parsed.error.flatten().fieldErrors, dict.auth.validation),
      values: { email: text(formData, "email") },
    };
  }

  const dict = await getDictionary();

  // Every one of these sends a letter, so the ceiling is also this app's
  // email quota — and the form is otherwise a way to have it send mail to
  // somebody else's address, over and over, at this app's expense.
  const gate = await consume(
    limits.passwordReset(parsed.data.email, await callerAddress()),
  );
  if (!gate.ok) {
    return {
      errors: {
        email: [
          interpolate(dict.auth.tooManyResets, {
            minutes: gate.retryAfterMinutes,
          }),
        ],
      },
      values: { email: parsed.data.email },
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  });

  // Only actually create a token / send an email if the account exists, but
  // always report success below — never reveal whether an email is registered.
  if (user) {
    const token = createToken();

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: token.hash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const baseUrl = appUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token.raw}`;

    try {
      await sendEmail({
        to: user.email,
        subject: dict.auth.resetEmailSubject,
        html: `<p>${dict.auth.resetEmailHeading}</p><p><a href="${resetUrl}">${dict.auth.resetEmailCta}</a></p><p style="color:#888;font-size:12px">${dict.auth.resetEmailIgnore}</p>`,
      });
    } catch (err) {
      // Email delivery isn't configured everywhere yet (RESEND_API_KEY) —
      // the token still exists in the DB, so don't fail the request over it.
      console.error("Failed to send password reset email:", err);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] Password reset link: ${resetUrl}`);
      }
    }
  }

  return { sent: true };
}

export type ResetPasswordState =
  | {
      errors?: {
        password?: string[];
        passwordConfirm?: string[];
        _form?: string[];
      };
    }
  | undefined;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    const dict = await getDictionary();
    return {
      errors: localize(parsed.error.flatten().fieldErrors, dict.auth.validation),
    };
  }

  const dict = await getDictionary();

  // The token is 32 random bytes, so this is not about guessing it — it is
  // about not letting anyone hash a few million candidates against the
  // database for free.
  const gate = await consume(
    limits.passwordResetSubmit(await callerAddress()),
  );
  if (!gate.ok) {
    return {
      errors: {
        _form: [
          interpolate(dict.auth.tooManyAttempts, {
            minutes: gate.retryAfterMinutes,
          }),
        ],
      },
    };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { errors: { _form: [dict.auth.resetInvalidToken] } };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=1");
}

export async function setYearlyGoal(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const parsed = YearlyGoalSchema.safeParse({
    target: formData.get("target"),
  });
  if (!parsed.success) {
    const dict = await getDictionary();
    return { ok: false, error: dict.goal.invalid };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { yearlyGoal: parsed.data.target > 0 ? parsed.data.target : null },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
