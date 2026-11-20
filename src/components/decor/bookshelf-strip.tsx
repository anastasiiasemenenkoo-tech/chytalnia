import {
  ShelfBookStack,
  ShelfCat,
  ShelfPlant,
} from "@/components/books/shelf-decor";
import { Plank } from "@/components/decor/plank";
import { SpineArt, type Design } from "@/components/decor/spine-art";

/**
 * A shelf with nobody's books on it — the piece of furniture the sign-in card
 * stands in front of.
 *
 * Decorative, and honestly so: the spines carry no titles, because inventing
 * book titles to decorate a login page would be putting words in a library's
 * mouth. They carry everything else a cover has — a diamond pattern, a scroll
 * of loops over a framed panel, a star, stitching down both edges — drawn
 * from the reference the user sent, in `spine-art.tsx`.
 *
 * The thing that makes a real shelf look real is repetition: people buy
 * series, so matching books stand together. The arrangement is written out by
 * hand in runs, with one gap where something was pulled out and the white one
 * leaning into it.
 */

type Book = {
  design: Design;
  width: number;
  height: number;
  lean?: number;
  gapBefore?: boolean;
};

const run = (count: number, book: Book): Book[] =>
  Array.from({ length: count }, () => book);

/** Carried by a phone. */
const CORE: Book[] = [
  ...run(2, { design: "diamonds", width: 20, height: 88 }),
  { design: "loops", width: 26, height: 96 },
  ...run(2, { design: "star", width: 16, height: 82 }),
  { design: "stitched", width: 15, height: 92 },
  { design: "paper", width: 18, height: 86, lean: -8, gapBefore: true },
];

/** Only once there is a shelf wider than a phone to put them on. */
const WIDE: Book[] = [
  ...run(3, { design: "loops", width: 19, height: 90 }),
  { design: "diamonds", width: 22, height: 80 },
  ...run(2, { design: "stitched", width: 14, height: 98 }),
  { design: "star", width: 21, height: 86 },
  { design: "paper", width: 17, height: 78 },
  ...run(2, { design: "diamonds", width: 16, height: 94 }),
  { design: "loops", width: 24, height: 84 },
  { design: "stitched", width: 13, height: 76 },
];

/** The short run with two books lying flat on top of it. */
const UNDER_FLATS: Book[] = [
  { design: "star", width: 15, height: 62 },
  { design: "diamonds", width: 14, height: 60 },
];

function Spine({ book }: { book: Book }) {
  return (
    <span
      // Square tops, as in the reference: a book is cut, not moulded.
      className="block shrink-0 overflow-hidden"
      style={{
        width: book.width,
        height: book.height,
        marginInlineStart: book.gapBefore ? 10 : undefined,
        transform: book.lean ? `rotate(${book.lean}deg)` : undefined,
        transformOrigin:
          book.lean && book.lean < 0 ? "bottom left" : "bottom right",
        boxShadow: "inset 1px 0 0 var(--spine-seam)",
      }}
    >
      <SpineArt design={book.design} width={book.width} height={book.height} />
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
              className="h-[5px]"
              style={{ backgroundColor: "var(--deco-blue)" }}
            />
            <span
              className="h-[6px]"
              style={{ backgroundColor: "var(--deco-vermilion)" }}
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
