/**
 * Purely decorative props that share the shelf with the books — a plant, a
 * small stack of books lying flat, and the cat.
 *
 * Inline SVG on purpose: no network request, and every drawing inherits the
 * theme through CSS variables.
 *
 * House style: flat fills, no gradients, but never a single flat silhouette —
 * each prop has one shaded side and a soft ellipse where it meets the board,
 * which is what stops a flat drawing from looking like a sticker.
 */

/** The shadow a prop casts on the plank it is standing on. */
function Contact({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={rx / 6} fill="var(--shelf-contact)" />
  );
}

/**
 * One monstera leaf: a rounded blade with two notches cut out of each side
 * and a stem running back to the pot.
 */
function MonsteraLeaf({
  rotate,
  scale = 1,
  fill,
}: {
  rotate: number;
  scale?: number;
  fill: string;
}) {
  return (
    <g transform={`rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0C-3-9-3-18 0-26"
        fill="none"
        stroke="var(--leaf-vein)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <g transform="translate(0 -26)">
        <path
          d="M0 4C-11 0-15-10-11-19-7-27 0-30 0-30c0 0 7 3 11 11 4 9 0 19-11 23z"
          fill={fill}
        />
        {/* The splits. Cut in the background colour so the leaf reads as one
            shape with holes, not as separate petals. */}
        <g fill="var(--background)">
          <path d="M0-24c-4 1-7 4-8 7l8 1z" />
          <path d="M0-12c-5 1-8 4-9 7l9 1z" />
          <path d="M0-24c4 1 7 4 8 7l-8 1z" />
          <path d="M0-12c5 1 8 4 9 7l-9 1z" />
        </g>
      </g>
    </g>
  );
}

export function ShelfPlant() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 64 88"
      className="pointer-events-none h-[88px] w-16 shrink-0 self-end"
    >
      <Contact cx={32} cy={86} rx={20} />

      <g transform="translate(32 62)">
        <MonsteraLeaf rotate={-34} scale={0.78} fill="var(--leaf-deep)" />
        <MonsteraLeaf rotate={36} scale={0.72} fill="var(--leaf-deep)" />
        <MonsteraLeaf rotate={-12} scale={1} fill="var(--leaf)" />
        <MonsteraLeaf rotate={16} scale={0.9} fill="var(--leaf)" />
      </g>

      {/* A straight ceramic cylinder, not a flared flowerpot. */}
      <path
        d="M21 62h22v20a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z"
        fill="var(--pot)"
      />
      <path d="M35 62h8v20a4 4 0 0 1-4 4h-4z" fill="var(--pot-shade)" />
    </svg>
  );
}

export function ShelfBookStack() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 72 34"
      className="pointer-events-none h-[34px] w-[72px] shrink-0 self-end"
    >
      <Contact cx={36} cy={33} rx={32} />
      <rect x="2" y="23" width="68" height="9" rx="3" fill="var(--spine-7)" />
      <rect x="7" y="13" width="59" height="9" rx="3" fill="var(--spine-2)" />
      <rect x="13" y="3" width="47" height="9" rx="3" fill="var(--spine-4)" />
      <g fill="var(--spine-band)">
        <rect x="2" y="26" width="68" height="1" />
        <rect x="7" y="16" width="59" height="1" />
        <rect x="13" y="6" width="47" height="1" />
      </g>
    </svg>
  );
}

/**
 * The cat, asleep on the shelf: curled into a loaf with its tail round its
 * front and its chin on it. Every library has one.
 *
 * Curled rather than sitting — at sixty pixels a sleeping cat is one clean
 * silhouette, while a sitting one is a head, a body and a tail all competing
 * to be recognised at once.
 */
export function ShelfCat() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 78 46"
      className="pointer-events-none h-[46px] w-[78px] shrink-0 self-end"
    >
      <Contact cx={40} cy={44} rx={33} />

      {/* The back: one arc from the tucked haunches up and over to the head. */}
      <path
        d="M10 44C3 44 2 33 8 25 16 14 38 10 54 16 67 21 72 32 70 44z"
        fill="var(--cat)"
      />
      {/* The far side of the curl, in shade. */}
      <path d="M10 44C3 44 2 33 8 25c-1 7 1 13 6 19z" fill="var(--cat-shade)" />
      <g
        fill="none"
        stroke="var(--cat-stripe)"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M22 18c-2 3-3 5-3 8" />
        <path d="M31 15c-2 3-3 6-3 9" />
        <path d="M40 15c-1 3-2 6-2 9" />
      </g>
      <g fill="var(--cat)">
        <path d="M47 22 44 10l11 7z" />
        <path d="M68 24 71 13l-9 5z" />
      </g>
      <g fill="var(--cat-stripe)">
        <path d="M48 20.5 46.5 13l6 4z" />
        <path d="M67 21.5 68.5 15l-5 3z" />
      </g>
      <circle cx="58" cy="30" r="13" fill="var(--cat)" />
      {/* Tail, laid along the front and tucked under the chin. */}
      <path
        d="M12 42C22 48 40 48 52 42"
        fill="none"
        stroke="var(--cat)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M46 44a7 6 0 0 1 14 0z" fill="var(--cat-belly)" />
      <g
        fill="none"
        stroke="var(--cat-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M52 29c1.5 2 4.5 2 6 0" />
        <path d="M63 28.5c1 1.5 3 1.5 4 0" />
      </g>
      <path d="M60.5 34h3l-1.5 2z" fill="var(--cat-ink)" />
    </svg>
  );
}
