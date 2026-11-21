import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { getDictionary, getLocale } from "@/i18n";
import { plural } from "@/i18n/plural";
import { getCurrentUser } from "@/lib/session";
import { yearInReview } from "@/lib/year-in-review";

/**
 * The reader's year as a picture they can post.
 *
 * A link would have been less work, but a link means a public page with
 * somebody's reading on it, and this is what people actually put in a story
 * or a chat: the card itself. Nothing here leaves this app on its own —
 * the image is behind the session, and only its owner can ask for it.
 */

/** Theme tokens, written out: Satori resolves no CSS custom properties. */
const BACKGROUND = "#e6eafa";
const CARD = "#eef0fc";
const INK = "#1a1c29";
const MUTED = "#64677d";
const WOOD_LIT = "#c29370";
const WOOD = "#ad7859";
const WOOD_EDGE = "#87553e";
const SPINES = [
  "#963d3a",
  "#8e5224",
  "#73621c",
  "#296a3b",
  "#157171",
  "#006692",
  "#434d97",
  "#744388",
  "#90466c",
];
const EMPTY_SLOT = "#cdd3ee";

const SIZE = { width: 1200, height: 630 };
const SHELF_HEIGHT = 190;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [dict, locale, literata] = await Promise.all([
    getDictionary(),
    getLocale(),
    readFile(join(process.cwd(), "assets/fonts/Literata-SemiBold.ttf")),
  ]);

  const year = new Date().getFullYear();
  const review = await yearInReview(user.id, year);
  const tag = locale === "uk" ? "uk-UA" : "en-US";
  const number = new Intl.NumberFormat(tag);
  const peak = Math.max(...review.byMonth, 1);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BACKGROUND,
          fontFamily: "Literata",
          padding: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            borderRadius: 28,
            backgroundColor: CARD,
            padding: "44px 56px",
          }}
        >
          <div style={{ display: "flex", fontSize: 34, color: MUTED }}>
            {dict.brand} {year}
          </div>

          {/* Stacked, not side by side: the page count hung off the big
              number's baseline like a tail on it. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 14,
            }}
          >
            <div style={{ display: "flex", fontSize: 78, color: INK }}>
              {plural(dict.year.booksRead, review.finished, locale)}
            </div>
            {review.booksWithPages > 0 ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  color: MUTED,
                  marginTop: 6,
                }}
              >
                {plural(
                  dict.year.pagesRead,
                  review.pages,
                  locale,
                  number.format(review.pages),
                )}
              </div>
            ) : null}
          </div>

          {/* The same shelf the page draws: one spine per month. */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: SHELF_HEIGHT,
              marginTop: 34,
            }}
          >
            {review.byMonth.map((count, month) => (
              <div
                key={month}
                style={{
                  display: "flex",
                  width: 62,
                  height:
                    count > 0
                      ? Math.max(18, Math.round((count / peak) * SHELF_HEIGHT))
                      : 4,
                  backgroundColor:
                    count > 0 ? SPINES[month % SPINES.length] : EMPTY_SLOT,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 844 }}>
            <div
              style={{ display: "flex", height: 9, backgroundColor: WOOD_LIT }}
            />
            <div style={{ display: "flex", height: 16, backgroundColor: WOOD }} />
            <div
              style={{ display: "flex", height: 4, backgroundColor: WOOD_EDGE }}
            />
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "auto",
              fontSize: 26,
              color: MUTED,
            }}
          >
            {review.topAuthors.length > 0
              ? review.topAuthors.map((a) => a.author).join(" · ")
              : dict.tagline}
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [
        { name: "Literata", data: literata, style: "normal", weight: 600 },
      ],
    },
  );
}
