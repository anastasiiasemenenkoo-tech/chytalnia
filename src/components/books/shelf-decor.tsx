/**
 * Purely decorative props that share the shelf with the books — a plant, a
 * small stack of books lying flat, and the cat.
 *
 * Inline SVG on purpose: no network request, and every drawing inherits the
 * theme through CSS variables.
 */

export function ShelfPlant() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 64 88"
      className="pointer-events-none h-[88px] w-16 shrink-0 self-end"
    >
      {/* A snake plant: blades, not blobs. Each leaf is one closed path that
          starts narrow at the soil, swells, and comes back to a point. */}
      <g fill="var(--leaf-deep)">
        <path d="M30 60C24 46 16 32 9 22c8 9 17 23 22 38z" />
        <path d="M34 60c6-14 14-28 21-38-8 9-17 23-22 38z" />
      </g>
      <g fill="var(--leaf)">
        <path d="M29 60C25 44 21 26 19 10c5 14 10 32 13 50z" />
        <path d="M35 60c4-16 8-34 10-50-5 14-10 32-13 50z" />
        <path d="M31 60c-1-18-1-36 1-52 2 16 2 34 1 52z" />
      </g>

      {/* A straight-sided pot, tapering just enough to sit still. */}
      <path
        d="M14 62h36l-4 22a4 4 0 0 1-4 3H22a4 4 0 0 1-4-3z"
        fill="var(--pot)"
      />
      <rect x="11" y="56" width="42" height="8" rx="2" fill="var(--pot-rim)" />
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
 * The cat, sitting at the end of the shelf with its eyes shut and its tail
 * curled round its feet. Every library has one.
 */
export function ShelfCat() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 62 58"
      className="pointer-events-none h-[58px] w-[62px] shrink-0 self-end"
    >
      {/* Tail first, so the body sits in front of where it tucks in. */}
      <path
        d="M43 55c11-1 14-10 9-15"
        fill="none"
        stroke="var(--cat)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Body: narrow at the shoulders, spread at the haunches. */}
      <path d="M19 56c-4-14-2-25 6-29h10c8 4 10 15 6 29z" fill="var(--cat)" />
      <path d="M25 56c-2-9-1-15 4-17 5 2 6 8 4 17z" fill="var(--cat-belly)" />
      {/* Ears, behind the head so only the tips show. */}
      <g fill="var(--cat)">
        <path d="M19 14 16 2l12 7z" />
        <path d="M43 14 46 2 34 9z" />
      </g>
      <g fill="var(--cat-stripe)">
        <path d="M20 12 18.5 5l6.5 4z" />
        <path d="M42 12l1.5-7-6.5 4z" />
      </g>
      <circle cx="31" cy="20" r="13" fill="var(--cat)" />
      {/* Tabby stripes: two over the brow, two along the back. */}
      <g
        fill="none"
        stroke="var(--cat-stripe)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M27 9c1 2 1 3 1 4" />
        <path d="M35 9c-1 2-1 3-1 4" />
        <path d="M20 38c2 1 3 2 4 2" />
        <path d="M42 38c-2 1-3 2-4 2" />
      </g>
      {/* Asleep: two shut eyes and a small nose. */}
      <g
        fill="none"
        stroke="var(--cat-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M23 20c1.5 2 4.5 2 6 0" />
        <path d="M33 20c1.5 2 4.5 2 6 0" />
      </g>
      <path d="M29.5 25h3l-1.5 2z" fill="var(--cat-ink)" />
    </svg>
  );
}
