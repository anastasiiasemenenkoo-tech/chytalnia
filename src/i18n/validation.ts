import type { ZodError } from "zod";

import type { Dictionary } from "@/i18n";

type ValidationDict = Dictionary["validation"];

/**
 * Turn a failed parse into one sentence the reader's own locale.
 *
 * The schemas in `@/lib/validators` put dictionary keys where a message would
 * normally go, so the prose lives in the dictionaries and not in the rules.
 * Anything unrecognised — a Zod default, an older hardcoded string — becomes
 * the generic message rather than reaching the screen in English.
 *
 * `fields` names the fields worth reporting, in the order they should be
 * tried; without it the first issue wins.
 */
export function firstMessage(
  error: ZodError<unknown>,
  dict: Dictionary,
  fields?: readonly string[],
): string {
  const validation = dict.validation;
  const issues = error.issues;

  const pick = fields
    ? fields
        .map((field) =>
          issues.find((issue) => issue.path[0] === field),
        )
        .find((issue) => issue !== undefined) ?? issues[0]
    : issues[0];

  return translate(pick?.message, validation);
}

/** One key, for the places that already hold a single message. */
export function translate(
  message: string | undefined,
  validation: ValidationDict,
): string {
  if (!message) return validation.generic;
  const known = validation[message as keyof ValidationDict];
  return known ?? validation.generic;
}
