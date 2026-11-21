import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { getDictionary } from "@/i18n";

export const alt = "Читальня";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card a link to this app shows in a chat window. Without it a shared
 * link is a grey rectangle, which is most of what a link is judged on.
 *
 * Drawn out of the same shelf the app is built from, but in plain colours
 * and flex boxes: this renders through Satori, which knows neither CSS
 * custom properties nor grid, so the theme tokens are written out as the hex
 * they resolve to in the light theme.
 */
const BACKGROUND = "#e6eafa";
const INK = "#1a1c29";
const MUTED = "#64677d";
const WOOD_LIT = "#c29370";
const WOOD = "#ad7859";
const WOOD_EDGE = "#87553e";
const PAGE_EDGE = "#ebe4d4";
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

/** Heights in the same uneven run the real shelves stand in. */
const BOOKS = [
  { colour: 0, width: 38, height: 168 },
  { colour: 0, width: 38, height: 168 },
  { colour: 6, width: 50, height: 184 },
  { colour: 2, width: 30, height: 156 },
  { colour: 2, width: 30, height: 156 },
  { colour: 8, width: 28, height: 176 },
  { colour: 4, width: 34, height: 164 },
  { colour: 1, width: 44, height: 148 },
  { colour: 5, width: 36, height: 180 },
  { colour: 3, width: 32, height: 160 },
  { colour: 7, width: 40, height: 172 },
  { colour: 0, width: 26, height: 144 },
];

export default async function Image() {
  const [dict, literata] = await Promise.all([
    getDictionary(),
    readFile(join(process.cwd(), "assets/fonts/Literata-SemiBold.ttf")),
  ]);

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
          padding: "0 80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 104, color: INK }}>
          {dict.brand}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: MUTED,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          {dict.tagline}
        </div>

        {/* The shelf, cut off at both sides the way it is on the way in. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            marginTop: 64,
            gap: 2,
          }}
        >
          {BOOKS.map((book, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                width: book.width,
                height: book.height,
                backgroundColor: SPINES[book.colour],
              }}
            >
              {/* The page block showing under the cover. */}
              <div
                style={{
                  display: "flex",
                  height: 6,
                  marginLeft: 4,
                  marginRight: 4,
                  marginBottom: 5,
                  backgroundColor: PAGE_EDGE,
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
          <div style={{ display: "flex", height: 10, backgroundColor: WOOD_LIT }} />
          <div style={{ display: "flex", height: 18, backgroundColor: WOOD }} />
          <div style={{ display: "flex", height: 4, backgroundColor: WOOD_EDGE }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Literata", data: literata, style: "normal", weight: 600 },
      ],
    },
  );
}
