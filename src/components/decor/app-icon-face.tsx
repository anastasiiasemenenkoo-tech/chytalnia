/**
 * The icon that ends up on a home screen: the cat, sitting behind a row of
 * books.
 *
 * The cat alone said «a cat app». At sixty pixels there is room for exactly
 * two things, so the second one is books — spines, the same vocabulary the
 * shelves and the year chart are drawn in, which is the one shape nobody
 * mistakes for anything else. A letter would have fought the cat for the
 * middle of the square and lost.
 *
 * The cat is cut down to what survives at that size: ears, a ginger head,
 * the white blaze, two amber eyes and a nose. Marbling, whiskers and paws
 * all turn to mud.
 *
 * Rendered through Satori, which resolves no CSS custom properties, so the
 * palette is the light theme's values written out.
 */
const BACKGROUND = "#e6eafa";
const CAT = "#ef7e3c";
const SHADE = "#db5d2c";
const WHITE = "#f7f1e8";
const NOSE = "#efa3a5";
const EYE = "#e19b34";
const INK = "#3f271e";
const PAGE_EDGE = "#ebe4d4";

/** The spines, in the order they stand. Taller ones flank the cat. */
const BOOKS = [
  { x: 4, width: 15, top: 66, colour: "#963d3a" },
  { x: 20, width: 13, top: 71, colour: "#73621c" },
  { x: 34, width: 14, top: 68, colour: "#006692" },
  { x: 49, width: 13, top: 72, colour: "#296a3b" },
  { x: 63, width: 15, top: 67, colour: "#744388" },
  { x: 79, width: 13, top: 70, colour: "#8e5224" },
];

export function AppIconFace({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BACKGROUND,
      }}
    >
      <svg width={size * 0.88} height={size * 0.88} viewBox="0 0 100 100">
        {/* Ears behind the head, so their bases disappear under it. */}
        <path d="M24 38 19 8l27 14z" fill={CAT} />
        <path d="M76 38 81 8 54 22z" fill={CAT} />
        <path d="M28 33 25 16l15 8z" fill={NOSE} />
        <path d="M72 33 75 16l-15 8z" fill={NOSE} />

        <ellipse cx="50" cy="44" rx="29" ry="26" fill={CAT} />
        {/* A narrow wedge between the eyes, widening into the muzzle. */}
        <path d="M50 20 46 50h8z" fill={WHITE} />
        <ellipse cx="50" cy="55" rx="16" ry="11" fill={WHITE} />

        <ellipse cx="36" cy="42" rx="7" ry="7.6" fill={EYE} />
        <ellipse cx="64" cy="42" rx="7" ry="7.6" fill={EYE} />
        <ellipse cx="36" cy="42" rx="3.2" ry="4.6" fill={INK} />
        <ellipse cx="64" cy="42" rx="3.2" ry="4.6" fill={INK} />
        <circle cx="38" cy="39.4" r="1.6" fill={WHITE} />
        <circle cx="66" cy="39.4" r="1.6" fill={WHITE} />

        <path d="M46 50h8l-4 4.6z" fill={NOSE} />
        <path
          d="M50 54.6v2.8M50 57.4c-2.2 2.2-5 1.8-6.4 0M50 57.4c2.2 2.2 5 1.8 6.4 0"
          fill="none"
          stroke={INK}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M31 62c6 7 32 7 38 0"
          fill="none"
          stroke={SHADE}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* The books stand in front, so the cat is sitting behind them. */}
        {BOOKS.map((book) => (
          <g key={book.x}>
            <rect
              x={book.x}
              y={book.top}
              width={book.width}
              height={100 - book.top}
              fill={book.colour}
            />
            <rect
              x={book.x + 2}
              y={book.top + 4}
              width={book.width - 4}
              height="2.4"
              fill={PAGE_EDGE}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
