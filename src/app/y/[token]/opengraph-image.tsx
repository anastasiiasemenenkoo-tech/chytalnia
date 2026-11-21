import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { CARD_SIZE, YearCardImage } from "@/components/year/year-card-image";
import { getDictionary, getLocale } from "@/i18n";
import { yearByShareToken } from "@/lib/year-in-review";

export const alt = "Читальня";
export const size = CARD_SIZE;
export const contentType = "image/png";

/**
 * What a shared link looks like in a chat window: the reader's actual
 * numbers, not a generic banner. This is the whole reason the link is worth
 * sending — nobody opens «somebody shared a page with you».
 */
export default async function Image({
  params,
}: {
  // A promise in this version, as it is for pages. Typed as a plain object
  // it still compiles, and every preview quietly comes out as a 404.
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [shared, dict, locale, literata] = await Promise.all([
    yearByShareToken(token),
    getDictionary(),
    getLocale(),
    readFile(join(process.cwd(), "assets/fonts/Literata-SemiBold.ttf")),
  ]);

  // A revoked link keeps no picture either. The page is a 404 by then, and
  // chat apps cache previews for a long time.
  if (!shared) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    <YearCardImage
      review={shared.review}
      dict={dict}
      locale={locale}
      reader={shared.reader}
    />,
    {
      ...CARD_SIZE,
      fonts: [
        { name: "Literata", data: literata, style: "normal", weight: 600 },
      ],
    },
  );
}
