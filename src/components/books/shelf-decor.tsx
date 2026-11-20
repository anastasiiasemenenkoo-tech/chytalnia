/**
 * Purely decorative props that share the shelf with the books — a plant, a
 * small stack of books lying flat, and the cat.
 *
 * Inline SVG on purpose: no network request, and every drawing inherits the
 * theme through CSS variables.
 *
 * House style, matching the covers in `decor/spine-art.tsx`: flat fills, no
 * gradients and no cast shadows, square cuts rather than moulded edges, and
 * ornament made of the same vocabulary the books are printed with — dots,
 * diamonds, straight lines.
 */

export function ShelfPlant() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 64 88"
      className="pointer-events-none h-[88px] w-16 shrink-0 self-end"
    >
      {/* Sage leaves on thin stems, the way they are on the sheet of pots:
          two tall blades behind, three round ones in front. */}
      <g stroke="var(--leaf-deep)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M32 58v-18" fill="none" />
        <path d="M32 54 22 42" fill="none" />
        <path d="M32 54 42 42" fill="none" />
      </g>
      <g fill="var(--leaf-deep)">
        <path d="M24 40c-3-8-2-16 1-22 4 6 5 14 2 22z" />
        <path d="M42 42c3-7 3-14 1-19-4 5-5 12-2 19z" />
      </g>
      <g fill="var(--leaf)">
        <ellipse cx="32" cy="36" rx="7" ry="9" />
        <ellipse cx="20" cy="42" rx="8" ry="6" transform="rotate(-22 20 42)" />
        <ellipse cx="44" cy="44" rx="8" ry="6" transform="rotate(22 44 44)" />
      </g>

      {/* The pot, with a rim and a face. */}
      <path
        d="M17 62h30l-3 20a5 5 0 0 1-5 4H25a5 5 0 0 1-5-4z"
        fill="var(--pot)"
      />
      <rect
        x="14"
        y="56"
        width="36"
        height="8"
        rx="3"
        fill="var(--pot-shade)"
      />
      <g fill="var(--pot-cheek)">
        <ellipse cx="23" cy="76" rx="3.5" ry="2.2" />
        <ellipse cx="41" cy="76" rx="3.5" ry="2.2" />
      </g>
      <g
        stroke="var(--cat-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M26 73q2-2.4 4 0" />
        <path d="M34 73q2-2.4 4 0" />
        <path d="M30 78q2 2 4 0" />
      </g>
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
      <rect x="2" y="23" width="68" height="9" fill="var(--spine-7)" />
      <rect x="7" y="13" width="59" height="9" fill="var(--spine-2)" />
      <rect x="13" y="3" width="47" height="9" fill="var(--spine-4)" />
      <g fill="var(--page-edge)">
        <rect x="4" y="29" width="64" height="2.5" />
        <rect x="9" y="19" width="55" height="2.5" />
        <rect x="15" y="9" width="43" height="2.5" />
      </g>
    </svg>
  );
}

/**
 * The cat, lying along the shelf with its front paws stretched out and its
 * tail curled round behind — copied from the close-up the user sent.
 *
 * The body is one mass and the head another sitting in front of it, which is
 * how that drawing is built; forcing them into a single outline was what made
 * the earlier attempts look like a loaf. The markings are soft blotches, not
 * ruled stripes, and the eyes are big white discs with a dark dot in each.
 */
export function ShelfCat() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 96 54"
      className="pointer-events-none h-[54px] w-[96px] shrink-0 self-end"
    >
      {/* Tail, curling off to the right behind the haunch. */}
      <path
        d="M76 50C90 52 94 42 87 35"
        fill="none"
        stroke="var(--cat)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g
        stroke="var(--cat-stripe)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M86 51c.5-1.6.6-3 .4-4.4" />
        <path d="M92 44c-1.4-.9-2.4-1.8-3.2-3" />
      </g>

      {/* The body: one soft mass, higher at the haunch. */}
      <path
        d="M38 52C29 46 29 31 42 25 56 18 72 21 80 30 87 38 85 52 77 52z"
        fill="var(--cat)"
      />
      {/* Blotches rather than stripes — the reference is painted, not ruled. */}
      <g fill="var(--cat-stripe)">
        <ellipse
          cx="52"
          cy="28"
          rx="7"
          ry="3.6"
          transform="rotate(-14 52 28)"
        />
        <ellipse cx="66" cy="26" rx="6" ry="3.2" transform="rotate(-8 66 26)" />
        <ellipse
          cx="72"
          cy="38"
          rx="6.5"
          ry="3.4"
          transform="rotate(16 72 38)"
        />
        <ellipse cx="56" cy="41" rx="6" ry="3.2" transform="rotate(10 56 41)" />
      </g>

      {/* Front legs stretched forward, and the chest: all white. */}
      <path
        d="M16 52C9 52 5 50 5 47.5 5 45 9 43 16 43h22c4 0 7 2.2 7 4.5S42 52 38 52z"
        fill="var(--cat-white)"
      />
      <path
        d="M15 44.5V52"
        stroke="var(--cat-white-shade)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* The head, in front of the body, ears part of its outline. */}
      <path
        d="M11 31C11 24.5 13.5 19.5 17.5 17L14.5 4 26.5 12.5C29.5 12 33 12.3 36 13.8L41.5 3 41 19.6C42.5 23 43 27 43 31 43 39.5 36 45 27 45 18 45 11 39.5 11 31z"
        fill="var(--cat)"
      />
      <g fill="var(--cat-nose)">
        <path d="M17.5 14.5 16.5 8l6.5 4.6z" />
        <path d="M37 15.5 40 9l-.3 7z" />
      </g>
      <g fill="var(--cat-stripe)">
        <ellipse cx="20" cy="20" rx="4" ry="2" transform="rotate(-18 20 20)" />
        <ellipse cx="34" cy="20" rx="4" ry="2" transform="rotate(18 34 20)" />
      </g>

      {/* The eyes that make the whole sheet read as cats. */}
      <g>
        <ellipse cx="21" cy="28" rx="5.6" ry="6" fill="var(--cat-white)" />
        <ellipse cx="34" cy="28" rx="5.6" ry="6" fill="var(--cat-white)" />
        <circle cx="21.4" cy="28.4" r="2.5" fill="var(--cat-ink)" />
        <circle cx="34.4" cy="28.4" r="2.5" fill="var(--cat-ink)" />
      </g>

      {/* Muzzle. */}
      <path d="M25 35h5l-2.5 2.6z" fill="var(--cat-nose)" />
      <g
        stroke="var(--cat-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M27.5 37.6v1.8" />
        <path d="M27.5 39.4c-1.3 1.2-2.8 1-3.8 0" />
        <path d="M27.5 39.4c1.3 1.2 2.8 1 3.8 0" />
      </g>
      <g
        stroke="var(--cat-white)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M21 36 11 33.5" />
        <path d="M21 38.5 11 39" />
        <path d="M34 36 44 33.5" />
        <path d="M34 38.5 44 39" />
      </g>
    </svg>
  );
}
