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
 * front and its chin on it. Every library has one.
 *
 * Drawn the way the covers are — one flat orange shape, one flat white one,
 * and the markings printed on top as plain straight strokes. The earlier
 * version had a shaded far side and a soft shadow under it, which is exactly
 * what the books do not have.
 */
export function ShelfCat() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 78 46"
      className="pointer-events-none h-[46px] w-[78px] shrink-0 self-end"
    >
      {/* Tail: one flat band, with the white tip laid over its end. */}
      <path
        d="M12 42C22 48 40 48 52 42"
        fill="none"
        stroke="var(--cat)"
        strokeWidth="7"
        strokeLinecap="butt"
      />
      <path
        d="M12 42c3 1.8 6.5 3 10 3.6"
        fill="none"
        stroke="var(--cat-white)"
        strokeWidth="7"
        strokeLinecap="butt"
      />

      {/* The back: one arc from the tucked haunches up and over to the head. */}
      <path
        d="M10 44C3 44 2 33 8 25 16 14 38 10 54 16 67 21 72 32 70 44z"
        fill="var(--cat)"
      />
      {/* Markings: straight strokes, the same hand that ruled the covers. */}
      <g stroke="var(--cat-stripe)" strokeWidth="2.6" strokeLinecap="butt">
        <path d="M21 17v9" />
        <path d="M30 14v10" />
        <path d="M39 14v10" />
      </g>

      {/* Chest and front paws. */}
      <path d="M41 44c0-6 5-11 11.5-11S64 38 64 44z" fill="var(--cat-white)" />

      <g fill="var(--cat)">
        <path d="M47 22 44 10l11 7z" />
        <path d="M68 24 71 13l-9 5z" />
      </g>
      <g fill="var(--cat-nose)">
        <path d="M48 20.5 46.5 13l6 4z" />
        <path d="M67 21.5 68.5 15l-5 3z" />
      </g>

      {/* The face is white; the orange cap sits on top of it. */}
      <circle cx="58" cy="30" r="13" fill="var(--cat-white)" />
      <path
        d="M45.4 27.4a13 13 0 0 1 25.2 0c-3.6-1.6-8.4-2.6-12.6-2.6s-9 1-12.6 2.6z"
        fill="var(--cat)"
      />

      {/* Asleep: two shut eyes ruled flat, and a diamond for a nose. */}
      <g stroke="var(--cat-ink)" strokeWidth="1.6" strokeLinecap="butt">
        <path d="M52 31h6" />
        <path d="M63 30.5h4" />
      </g>
      <path d="M62 34 64 36 62 38 60 36z" fill="var(--cat-nose)" />
    </svg>
  );
}
