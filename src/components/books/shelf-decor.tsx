/**
 * Purely decorative props that share the shelf with the books — a plant, a
 * small stack of books lying flat, and the cat.
 *
 * Inline SVG on purpose: no network request, and every drawing inherits the
 * theme through CSS variables.
 */

/** One leaf, pointing up from the origin. Placed by rotating the group. */
function Leaf({
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
      <path d="M0 0C-7-8-7-20 0-28 7-20 7-8 0 0z" fill={fill} />
      <path
        d="M0-2v-22"
        fill="none"
        stroke="var(--leaf-vein)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
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
      {/* Big leaves rather than thin blades: at this size a broad shape
          reads as a houseplant and a narrow one reads as grass. */}
      <g transform="translate(32 60)">
        <Leaf rotate={-58} scale={0.85} fill="var(--leaf-deep)" />
        <Leaf rotate={58} scale={0.85} fill="var(--leaf-deep)" />
        <Leaf rotate={-30} scale={1} fill="var(--leaf)" />
        <Leaf rotate={30} scale={1} fill="var(--leaf)" />
        <Leaf rotate={0} scale={1.15} fill="var(--leaf)" />
      </g>

      <path
        d="M18 65h28l-2.5 18a3 3 0 0 1-3 2.5H23.5a3 3 0 0 1-3-2.5z"
        fill="var(--pot)"
      />
      <rect x="15" y="58" width="34" height="8" rx="2" fill="var(--pot-rim)" />
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
      <rect x="2" y="24" width="68" height="9" rx="2" fill="var(--spine-7)" />
      <rect x="6" y="14" width="60" height="9" rx="2" fill="var(--spine-2)" />
      <rect x="12" y="4" width="48" height="9" rx="2" fill="var(--spine-4)" />
      <g fill="var(--spine-band)">
        <rect x="2" y="27" width="68" height="1" />
        <rect x="6" y="17" width="60" height="1" />
        <rect x="12" y="7" width="48" height="1" />
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
      {/* The back: one arc from the tucked haunches up and over to the head. */}
      <path
        d="M10 44C3 44 2 33 8 25 16 14 38 10 54 16 67 21 72 32 70 44z"
        fill="var(--cat)"
      />
      {/* Tabby stripes over the spine. */}
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
      {/* Ears, then the head resting on the paws. */}
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
      {/* The paws the chin is resting on. */}
      <path d="M46 44a7 6 0 0 1 14 0z" fill="var(--cat-belly)" />
      {/* Asleep. */}
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
