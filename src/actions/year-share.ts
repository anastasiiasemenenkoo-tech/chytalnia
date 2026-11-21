"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export type YearShareResult =
  | { ok: true; token: string | null }
  | { ok: false; error: string };

/** 96 bits, base64url: short enough to paste, long enough not to be found. */
function newToken() {
  return randomBytes(12).toString("base64url");
}

/**
 * Only years this app could plausibly have a review for. Without this the
 * year is whatever the request says, and a share row could be created for
 * 1066 or for 90210.
 */
function sane(year: number): number | null {
  const now = new Date().getFullYear();
  return Number.isInteger(year) && year >= 2000 && year <= now ? year : null;
}

/**
 * Open this reader's year to anyone with the link, and hand back the link.
 *
 * Asking twice gives the same link rather than a second one: two live links
 * to the same year would mean revoking is only ever half done.
 */
export async function createYearShare(year: number): Promise<YearShareResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const valid = sane(year);
  if (valid === null) return { ok: false, error: dict.year.shareLinkFailed };

  try {
    const share = await prisma.yearShare.upsert({
      where: { userId_year: { userId: user.id, year: valid } },
      update: {},
      create: { userId: user.id, year: valid, token: newToken() },
      select: { token: true },
    });
    revalidatePath("/year");
    return { ok: true, token: share.token };
  } catch {
    return { ok: false, error: dict.year.shareLinkFailed };
  }
}

/** Take the link back. The row goes, and the address stops resolving. */
export async function revokeYearShare(year: number): Promise<YearShareResult> {
  const user = await requireCurrentUser();
  const dict = await getDictionary();
  const valid = sane(year);
  if (valid === null) return { ok: false, error: dict.year.shareLinkFailed };

  try {
    await prisma.yearShare.deleteMany({
      where: { userId: user.id, year: valid },
    });
    revalidatePath("/year");
    return { ok: true, token: null };
  } catch {
    return { ok: false, error: dict.year.shareLinkFailed };
  }
}
