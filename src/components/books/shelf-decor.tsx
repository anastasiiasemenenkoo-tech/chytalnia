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

/**
 * Куди веде кожна з трьох речей на полиці. Три посилання, бо три різні
 * прохання: кіт — про притулок, книжки — про бібліотеки, рослина — про
 * природу, яку ніхто не поливає.
 */
/** Притулок «Сіріус» — найбільший в Україні. */
const SHELTER_URL = "https://dogcat.com.ua/adoption";
/** Фонд «Бібліотечна країна»: книжкові пакети для бібліотек України. */
export const LIBRARY_URL = "https://livelibrary.com.ua/books";
/** Українська природоохоронна група. */
const NATURE_URL = "https://uncg.org.ua/pidtrymaty/";

export type ShelfLinkText = { caption: string; label: string };

/**
 * Те, що робить річ на полиці посиланням: наведення (або фокус) піднімає над
 * нею підпис, а клік відкриває фонд у новій вкладці.
 *
 * Малюнок усередині лишається `pointer-events-none` і `aria-hidden` — курсор
 * і читач екрана мають справу з посиланням, а не з десятком фігур у ньому.
 */
export function ShelfLink({
  href,
  caption,
  label,
  className,
  children,
}: ShelfLinkText & {
  href: string;
  /** Для речей, які ховаються на вузьких екранах. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`group focus-visible:ring-ring relative shrink-0 self-end rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${className ?? ""}`}
    >
      {/* Підпис тримається в межах полиці: вузький, у два рядки, над річчю. */}
      <span className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-40 -translate-x-1/2 rounded-md border px-2 py-1 text-center text-[11px] leading-snug opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {caption}
      </span>
      {children}
    </a>
  );
}

/**
 * Рослина в горщику. Без підпису вона просто стоїть на полиці; з підписом
 * стає проханням за ту природу, за якою доглядати нікому.
 */
export function ShelfPlant({ text }: { text?: ShelfLinkText }) {
  const svg = (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 64 88"
      className={
        text
          ? "pointer-events-none block h-[88px] w-16"
          : "pointer-events-none h-[88px] w-16 shrink-0 self-end"
      }
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

  return text ? (
    <ShelfLink href={NATURE_URL} {...text}>
      {svg}
    </ShelfLink>
  ) : (
    svg
  );
}

/**
 * Три книжки, що лежать плазом. Із підписом — прохання за бібліотеки, у яких
 * полиці порожні, бо книжки тут уже прочитані.
 */
export function ShelfBookStack({ text }: { text?: ShelfLinkText }) {
  const svg = (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 72 34"
      className={
        text
          ? "pointer-events-none block h-[34px] w-[72px]"
          : "pointer-events-none h-[34px] w-[72px] shrink-0 self-end"
      }
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

  return text ? (
    <ShelfLink href={LIBRARY_URL} {...text}>
      {svg}
    </ShelfLink>
  ) : (
    svg
  );
}

/**
 * Кіт, перемальований з фотографій, на яких він сидить на власній книжковій
 * полиці: рудий зі спини, біла манишка й лапи, білий клин між очима,
 * бурштинові очі й руда пляма на грудях, яку не сплутаєш.
 *
 * Пласкими плямами, без градієнтів і тіней — у тому ж стилі, що й обкладинки
 * поруч. Не портрет, а той самий кіт, намальований цією полицею.
 *
 * Він водночас і посилання: наведи — і він скаже, що комусь іще шукають дім.
 */
export function ShelfCat({ text }: { text: ShelfLinkText }) {
  return (
    <ShelfLink href={SHELTER_URL} {...text}>
      <svg
        aria-hidden
        focusable="false"
        viewBox="0 0 82 80"
        className="pointer-events-none block h-[80px] w-[82px]"
      >
        {/* Хвіст лежить уздовж полиці. Темніший за тіло навмисне: однаковим
            рудим він просто зливався б із крупом в одну пляму. */}
        <path
          d="M28 74C19 79 10 79 3 76"
          fill="none"
          stroke="var(--cat-shade)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Тіло: сидить, круп ліворуч, плечі праворуч. */}
        <path
          d="M26 78C16 78 13 68 16 57 19 44 28 34 42 31 56 28 68 34 71 47 74 59 71 72 66 78z"
          fill="var(--cat)"
        />
        {/* Мармурові смуги на крупі — м'які дуги, не лінійка. */}
        <g
          stroke="var(--cat-stripe)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M19 50c6-4 12-3 16 2" />
          <path d="M20 60c6-4 12-3 16 2" />
          <path d="M22 69c6-4 11-3 14 1" />
        </g>

        {/* Біла манишка й передні лапи. */}
        <path
          d="M54 33c10 0 16 11 16 25v16c0 3-2 4-5 4H45c-3 0-4-1-4-4V48c0-9 5-15 13-15z"
          fill="var(--cat-white)"
        />
        <g fill="var(--cat-white)">
          <ellipse cx="47.5" cy="75.5" rx="7.5" ry="3.5" />
          <ellipse cx="63" cy="75.5" rx="7.5" ry="3.5" />
        </g>
        <g
          stroke="var(--cat-white-shade)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M55.5 56v22" />
          <path d="M44 74h7" />
          <path d="M60 74h7" />
        </g>
        {/* Руда пляма на грудях — головна прикмета цього кота. */}
        <path
          d="M49 51c4-3 11-2 15 1-3 3-11 4-15-1z"
          fill="var(--cat)"
        />

        {/* Вуха за головою, щоб їхні основи ховалися під нею. */}
        <g fill="var(--cat)">
          <path d="M37 23 33 1l22 11z" />
          <path d="M75 23 79 1 57 12z" />
        </g>
        <g fill="var(--cat-nose)">
          <path d="M40 19 37.5 6 50 12.5z" />
          <path d="M72 19 74.5 6 62 12.5z" />
        </g>

        {/* Голова. */}
        <ellipse cx="56" cy="24" rx="21" ry="18" fill="var(--cat)" />
        {/* Білий клин між очима, що переходить у білу мордочку. */}
        <path d="M56 9 50 27h12z" fill="var(--cat-white)" />
        <ellipse cx="56" cy="31" rx="12" ry="9" fill="var(--cat-white)" />

        {/* Очі — бурштинові, як на фотографії. */}
        <g>
          <ellipse cx="46" cy="24" rx="4.2" ry="4.6" fill="var(--cat-eye)" />
          <ellipse cx="66" cy="24" rx="4.2" ry="4.6" fill="var(--cat-eye)" />
          <ellipse cx="46" cy="24" rx="2" ry="2.8" fill="var(--cat-ink)" />
          <ellipse cx="66" cy="24" rx="2" ry="2.8" fill="var(--cat-ink)" />
          <circle cx="47.4" cy="22.4" r="0.9" fill="var(--cat-white)" />
          <circle cx="67.4" cy="22.4" r="0.9" fill="var(--cat-white)" />
        </g>

        {/* Ніс і рот. */}
        <path d="M53 28h6l-3 3.4z" fill="var(--cat-nose)" />
        <g
          stroke="var(--cat-ink)"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M56 31.4v2.2" />
          <path d="M56 33.6c-1.4 1.4-3.2 1.2-4.2 0" />
          <path d="M56 33.6c1.4 1.4 3.2 1.2 4.2 0" />
        </g>
        <g
          stroke="var(--cat-white)"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M49 31 36 28" />
          <path d="M49 34 36 36" />
          <path d="M63 31 76 28" />
          <path d="M63 34 76 36" />
        </g>
      </svg>
    </ShelfLink>
  );
}
