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
      {/* Stems: straight lines, like the rules printed on a cover. */}
      <g stroke="var(--leaf-deep)" strokeWidth="2" strokeLinecap="square">
        <path d="M32 62V30" />
        <path d="M32 54 18 38" />
        <path d="M32 54 46 38" />
        <path d="M32 46 22 56" />
        <path d="M32 46 42 56" />
      </g>

      {/* Leaves: one flat shape each, no veins, no highlights. */}
      <g fill="var(--leaf)">
        <ellipse cx="32" cy="24" rx="7" ry="11" />
        <ellipse
          cx="16"
          cy="34"
          rx="10"
          ry="6.5"
          transform="rotate(-28 16 34)"
        />
        <ellipse
          cx="48"
          cy="34"
          rx="10"
          ry="6.5"
          transform="rotate(28 48 34)"
        />
      </g>
      <g fill="var(--leaf-deep)">
        <ellipse cx="21" cy="52" rx="8" ry="5" transform="rotate(26 21 52)" />
        <ellipse cx="43" cy="52" rx="8" ry="5" transform="rotate(-26 43 52)" />
      </g>

      {/* A straight-sided pot, cut square, printed with the diamond band the
          salmon book wears. */}
      <rect x="20" y="62" width="24" height="24" fill="var(--pot)" />
      <g fill="var(--pot-shade)">
        <path d="M26 74 29 70 32 74 29 78z" />
        <path d="M35 74 38 70 41 74 38 78z" />
      </g>
      <rect x="20" y="62" width="24" height="3" fill="var(--pot-shade)" />
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
 * The cat, asleep on the shelf: curled into a loaf with its tail round its
 * front. Every library has one.
 *
 * **One silhouette.** The earlier versions drew a body, then stuck a circle on
 * it for a head and two spikes on that for ears, and the joins showed: at this
 * size it read as parts rather than a cat. Here the back, the head and both
 * ears are a single outline, and everything else — the white, the stripes, the
 * shut eyes — is printed on top of it, which is exactly how the covers are
 * built.
 */
export function ShelfCat() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 78 46"
      className="pointer-events-none h-[46px] w-[78px] shrink-0 self-end"
    >
      {/* Back, head and both ears in one outline. */}
      <path
        d="M6 44C1 35 3 25 12 19 23 11 37 9 46 13L48 4 56 12C59 11 63 11 66 13L71 4 73 17C76 24 75 33 72 38 70 42 67 44 63 44z"
        fill="var(--cat)"
      />

      {/* Muzzle and chest: one white shape, not a face patch plus a bib. */}
      <ellipse cx="60" cy="34" rx="12.5" ry="10" fill="var(--cat-white)" />

      {/* Inner ears. */}
      <g fill="var(--cat-nose)">
        <path d="M49 12 48.5 7 53 11z" />
        <path d="M70 12 70.5 7 66 11z" />
      </g>

      {/* Markings, ruled straight like the lines printed on a cover. */}
      <g stroke="var(--cat-stripe)" strokeWidth="2.6" strokeLinecap="butt">
        <path d="M20 17v8" />
        <path d="M29 14v9" />
        <path d="M38 13v9" />
      </g>

      {/* Asleep: two shut eyes curved the way a contented cat's are. */}
      <g
        fill="none"
        stroke="var(--cat-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M52 31q3.5 3 7 0" />
        <path d="M63 30.5q3 2.6 6 0" />
      </g>
      <path d="M57.5 36h5l-2.5 3z" fill="var(--cat-nose)" />

      {/* The tail comes round the front, so it goes on last. Same orange as
          the body, so it needs its own edge to be a tail and not a smudge. */}
      <g fill="none" strokeLinecap="round">
        <path
          d="M12 38C22 43 38 43 50 38"
          stroke="var(--cat-stripe)"
          strokeWidth="7"
        />
        <path
          d="M12 38C22 43 38 43 50 38"
          stroke="var(--cat)"
          strokeWidth="5"
        />
        <path
          d="M12 38c3 1.8 6 3 9 3.7"
          stroke="var(--cat-white)"
          strokeWidth="5"
        />
      </g>
    </svg>
  );
}
