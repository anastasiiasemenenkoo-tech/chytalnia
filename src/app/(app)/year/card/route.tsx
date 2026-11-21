import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { CARD_SIZE, YearCardImage } from "@/components/year/year-card-image";
import { getDictionary, getLocale } from "@/i18n";
import { getCurrentUser } from "@/lib/session";
import { yearInReview } from "@/lib/year-in-review";

/**
 * The reader's own year as a file they can post. Behind the session, and it
 * draws nobody's year but the caller's.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [dict, locale, literata] = await Promise.all([
    getDictionary(),
    getLocale(),
    readFile(join(process.cwd(), "assets/fonts/Literata-SemiBold.ttf")),
  ]);
  const review = await yearInReview(user.id, new Date().getFullYear());

  return new ImageResponse(
    <YearCardImage review={review} dict={dict} locale={locale} />,
    {
      ...CARD_SIZE,
      fonts: [
        { name: "Literata", data: literata, style: "normal", weight: 600 },
      ],
    },
  );
}
