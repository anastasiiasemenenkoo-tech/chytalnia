/**
 * The icon that ends up on a home screen: the cat sitting on a stack of
 * books.
 *
 * At sixty pixels there is room for exactly two things, and these are the
 * two the app is about. Books rather than a letter: a «Ч» would have fought
 * the cat for the middle of the square, while a stack of books is the
 * vocabulary the shelves, the year chart and the share card are already
 * drawn in, and nothing else looks like it.
 *
 * The cat is cut down to what survives at that size — ears, a ginger head,
 * the white blaze and chest, two amber eyes, a nose and the tail. Marbling,
 * whiskers and paw lines all turn to mud.
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

/** Three books lying flat, widest at the bottom, as a stack settles. */
const STACK = [
  { y: 88, x: 10, width: 80, colour: "#434d97" },
  { y: 78, x: 15, width: 70, colour: "#963d3a" },
  { y: 68, x: 21, width: 58, colour: "#73621c" },
];
const BOOK_HEIGHT = 9;

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
        {/* The tail, lying along the top book with the tip flicked up. A
            short stub here read as a stray orange blob at icon size; it
            needs the length and the curl to be a tail at all. Darker than
            the body on purpose — the same ginger merges into one shape. */}
        <path
          d="M60 64c10 4 19 3 23-4"
          fill="none"
          stroke={SHADE}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* The body: sitting, shoulders narrower than the haunches. */}
        <path d="M36 66c-3-12 2-22 14-22s17 10 14 22z" fill={CAT} />
        <path d="M43 66c-2-8 1-14 7-14s9 6 7 14z" fill={WHITE} />

        {/* Ears behind the head, so their bases disappear under it. */}
        <path d="M27 32 22 5l25 13z" fill={CAT} />
        <path d="M73 32 78 5 53 18z" fill={CAT} />
        <path d="M31 27 28 13l14 7z" fill={NOSE} />
        <path d="M69 27 72 13l-14 7z" fill={NOSE} />

        <ellipse cx="50" cy="35" rx="26" ry="23" fill={CAT} />
        {/* A narrow wedge between the eyes, widening into the muzzle. */}
        <path d="M50 14 46 40h8z" fill={WHITE} />
        <ellipse cx="50" cy="44" rx="15" ry="10" fill={WHITE} />

        <ellipse cx="37" cy="33" rx="6.6" ry="7.2" fill={EYE} />
        <ellipse cx="63" cy="33" rx="6.6" ry="7.2" fill={EYE} />
        <ellipse cx="37" cy="33" rx="3" ry="4.4" fill={INK} />
        <ellipse cx="63" cy="33" rx="3" ry="4.4" fill={INK} />
        <circle cx="38.8" cy="30.6" r="1.5" fill={WHITE} />
        <circle cx="64.8" cy="30.6" r="1.5" fill={WHITE} />

        <path d="M46.5 40h7l-3.5 4z" fill={NOSE} />
        <path
          d="M50 44v2.6M50 46.6c-2 2-4.6 1.6-6 0M50 46.6c2 2 4.6 1.6 6 0"
          fill="none"
          stroke={INK}
          strokeWidth="1.9"
          strokeLinecap="round"
        />

        {/* The stack last, so the cat is sitting on it and not behind it. */}
        {STACK.map((book) => (
          <g key={book.y}>
            <rect
              x={book.x}
              y={book.y}
              width={book.width}
              height={BOOK_HEIGHT}
              fill={book.colour}
            />
            <rect
              x={book.x + 2}
              y={book.y + BOOK_HEIGHT - 3}
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
