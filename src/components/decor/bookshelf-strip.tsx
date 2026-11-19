import {
  ShelfBookStack,
  ShelfCat,
  ShelfPlant,
} from "@/components/books/shelf-decor";
import { Plank } from "@/components/decor/plank";

/**
 * A shelf with nobody's books on it — the piece of furniture the sign-in card
 * stands in front of.
 *
 * Decorative, and honestly so: the spines carry no titles, because inventing
 * book titles to decorate a login page would be putting words in a library's
 * mouth. What they carry instead is everything else a spine has — foil
 * stamped near the ends, the block of flat colour a paperback series prints
 * over its bottom half, a publisher's dots.
 *
 * The thing that makes a real shelf look real is not variety, it is
 * **repetition**: three or five matching spines in a row, because people buy
 * series. A row where every book differs looks like a colour swatch. So the
 * arrangement is written out by hand in runs, with singles between them, one
 * gap where something was pulled out, and a couple of books laid flat on top
 * of a short group because they did not fit upright.
 */

/** The decorative palette: brighter than the real spines, which have to carry
 *  a white title and so cannot go light. */
const deco = (n: number) => `var(--deco-${n})`;

/** Pastels, so the row is not twenty saturated blocks in a line. */
const pale = (n: number, amount = 40) =>
  `color-mix(in oklab, var(--deco-${n}) ${amount}%, white)`;

type Book = {
  width: number;
  height: number;
  colour: string;
  /** What is printed on the spine. */
  style?: "foil" | "block" | "panel" | "dots" | "stripe";
  /** A pale spine prints in dark ink rather than light. */
  light?: boolean;
  /** Tilts into the gap left by the book that was taken out. */
  lean?: number;
  gapBefore?: boolean;
};

/** A run of matching books: the same edition, bought together. */
const run = (count: number, book: Book): Book[] =>
  Array.from({ length: count }, () => book);

/** Carried by a phone. */
const CORE: Book[] = [
  ...run(3, { width: 12, height: 86, colour: deco(6), style: "foil" }),
  { width: 8, height: 72, colour: deco(2) },
  { width: 18, height: 94, colour: deco(1), style: "panel" },
  ...run(3, {
    width: 10,
    height: 80,
    colour: pale(8),
    style: "block",
    light: true,
  }),
  { width: 7, height: 66, colour: deco(4) },
  { width: 15, height: 84, colour: deco(7), style: "dots" },
];

/** Only once there is a shelf wider than a phone to put them on. */
const WIDE: Book[] = [
  {
    width: 20,
    height: 92,
    colour: deco(5),
    style: "panel",
    // Leans back into the gap: books fall into empty space, not out of it.
    lean: -7,
    gapBefore: true,
  },
  ...run(5, { width: 11, height: 88, colour: deco(7), style: "foil" }),
  { width: 9, height: 70, colour: deco(3), light: true },
  { width: 17, height: 96, colour: "var(--spine-10)", style: "stripe" },
  ...run(3, {
    width: 13,
    height: 78,
    colour: pale(1, 45),
    style: "panel",
    light: true,
  }),
  { width: 8, height: 64, colour: deco(4) },
  { width: 22, height: 90, colour: deco(1), style: "block" },
  ...run(2, { width: 10, height: 76, colour: deco(5), style: "foil" }),
  { width: 14, height: 82, colour: pale(3, 55), style: "dots", light: true },
  { width: 19, height: 89, colour: deco(8), style: "panel" },
];

/** The short run with two books lying flat on top of it. */
const UNDER_FLATS: Book[] = [
  ...run(2, { width: 12, height: 62, colour: deco(4) }),
  { width: 10, height: 60, colour: pale(6, 50), light: true },
];

function Printing({ book, ink }: { book: Book; ink: string }) {
  switch (book.style) {
    case "foil":
      // Two bands stamped near the head of the spine, as on a hardback.
      return (
        <>
          <span
            className="absolute inset-x-0 top-[20%] h-[5px]"
            style={{ backgroundColor: "var(--spine-foil)" }}
          />
          <span
            className="absolute inset-x-0 top-[30%] h-[2px]"
            style={{ backgroundColor: "var(--spine-foil)" }}
          />
        </>
      );
    case "block":
      // The flat panel a paperback series prints over its lower half.
      return (
        <span
          className="absolute inset-x-0 bottom-0 h-[42%] rounded-b-[1px]"
          style={{
            backgroundColor: book.light ? "var(--spine-9)" : "var(--page-edge)",
          }}
        />
      );
    case "panel":
      return (
        <span
          className="absolute inset-x-[18%] top-[34%] h-[30%] rounded-[1px]"
          style={{ backgroundColor: ink }}
        />
      );
    case "dots":
      return (
        <span className="absolute inset-x-0 top-[40%] flex flex-col items-center gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-[3px] w-[3px] rounded-full"
              style={{ backgroundColor: ink }}
            />
          ))}
        </span>
      );
    case "stripe":
      return (
        <span
          className="absolute inset-x-0 top-[46%] h-[7px]"
          style={{ backgroundColor: "var(--page-edge)" }}
        />
      );
    default:
      return null;
  }
}

function Spine({ book }: { book: Book }) {
  const ink = book.light ? "var(--spine-seam)" : "var(--spine-band)";

  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-t-md"
      style={{
        width: book.width,
        height: book.height,
        backgroundColor: book.colour,
        marginInlineStart: book.gapBefore ? 10 : undefined,
        transform: book.lean ? `rotate(${book.lean}deg)` : undefined,
        transformOrigin:
          book.lean && book.lean < 0 ? "bottom left" : "bottom right",
        boxShadow:
          "inset -3px 0 0 var(--page-edge), inset 1px 0 0 var(--spine-seam)",
      }}
    >
      {/* The hairlines every spine has near its ends. */}
      <span
        className="absolute inset-x-[22%] top-[8px] h-px"
        style={{ backgroundColor: ink }}
      />
      <Printing book={book} ink={ink} />
      <span
        className="absolute inset-x-[22%] bottom-[8px] h-px"
        style={{ backgroundColor: ink }}
      />
    </span>
  );
}

export function BookshelfStrip() {
  return (
    <div aria-hidden className="w-full overflow-hidden">
      <div className="flex flex-nowrap items-end justify-center gap-px px-2 sm:px-4">
        {CORE.map((book, i) => (
          <Spine key={`core-${i}`} book={book} />
        ))}

        <span className="hidden shrink-0 items-end gap-px sm:flex">
          {WIDE.map((book, i) => (
            <Spine key={`wide-${i}`} book={book} />
          ))}
        </span>

        {/* Two that did not fit upright, laid across the short ones. */}
        <span className="relative hidden shrink-0 items-end gap-px sm:flex">
          <span className="absolute inset-x-0 -top-[13px] flex flex-col gap-px">
            <span
              className="h-[5px] rounded-sm"
              style={{ backgroundColor: "var(--deco-6)" }}
            />
            <span
              className="h-[6px] rounded-sm"
              style={{ backgroundColor: "var(--deco-2)" }}
            />
          </span>
          {UNDER_FLATS.map((book, i) => (
            <Spine key={`flat-${i}`} book={book} />
          ))}
        </span>

        {/* The stack is the first thing to go when the shelf runs out of
            room — the cat is not negotiable. */}
        <span className="ml-2 hidden shrink-0 items-end sm:flex">
          <ShelfBookStack />
        </span>
        <ShelfCat />
        <ShelfPlant />
      </div>
      <Plank />
    </div>
  );
}
