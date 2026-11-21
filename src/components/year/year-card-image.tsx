import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n";
import { plural } from "@/i18n/plural";
import type { YearInReview } from "@/lib/year-in-review";

/**
 * The year drawn as a 1200×630 picture — the file the reader posts, and the
 * preview a shared link shows. One function for both, so the two can never
 * drift into telling different stories about the same year.
 *
 * This renders through Satori, which knows neither CSS custom properties nor
 * grid, so the theme tokens are written out as the hex they resolve to in
 * the light theme and everything is flex.
 */
export const CARD_SIZE = { width: 1200, height: 630 };

const BACKGROUND = "#e6eafa";
const CARD = "#eef0fc";
const INK = "#1a1c29";
const MUTED = "#64677d";
const WOOD_LIT = "#c29370";
const WOOD = "#ad7859";
const WOOD_EDGE = "#87553e";
const EMPTY_SLOT = "#cdd3ee";
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

const SHELF_HEIGHT = 190;

export function YearCardImage({
  review,
  dict,
  locale,
  /** Whose year it is, on a card that leaves the owner's own screen. */
  reader,
}: {
  review: YearInReview;
  dict: Dictionary;
  locale: Locale;
  reader?: string | null;
}) {
  const number = new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-US");
  const peak = Math.max(...review.byMonth, 1);
  const footer =
    review.topAuthors.length > 0
      ? review.topAuthors.map((a) => a.author).join(" · ")
      : dict.tagline;

  return (
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
          {reader ? `${reader} · ` : ""}
          {dict.brand} {review.year}
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
          {footer}
        </div>
      </div>
    </div>
  );
}
