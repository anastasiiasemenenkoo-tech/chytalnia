import {
  ShelfBookStack,
  ShelfCat,
  ShelfPlant,
} from "@/components/books/shelf-decor";
import { Plank } from "@/components/decor/plank";
import { cn } from "@/lib/utils";

/**
 * A shelf with nobody's books on it — the piece of furniture the sign-in card
 * stands in front of.
 *
 * Decorative, and honestly so: the spines carry no titles, because inventing
 * book titles to decorate a login page would be putting words in a library's
 * mouth. What they carry instead is everything else a spine has — bands near
 * the ends, a publisher's dots, a lighter panel where the title would sit —
 * because a real shelf is dense and fussy, and a sparse row of plain blocks
 * reads as a bar chart rather than a bookcase.
 *
 * The arrangement is written out by hand rather than generated: a shelf
 * stacked by a person has runs of thin paperbacks, a fat hardback hogging the
 * middle, and a gap where something was pulled out to read.
 */

/** Pastels, so the row is not twenty dark jewel tones in a line. */
const pale = (spine: string, amount = 45) =>
  `color-mix(in oklab, var(--spine-${spine}) ${amount}%, white)`;

type Book = {
  width: number;
  height: number;
  colour: string;
  /** What is printed across the middle of the spine. */
  style?: "dots" | "panel" | "stripe";
  /** A pale spine needs dark printing rather than light. */
  light?: boolean;
  /** Tilts into the gap left by the book that was taken out. */
  lean?: number;
  /** Only once the shelf is wider than a phone. */
  wide?: boolean;
  gapBefore?: boolean;
};

const BOOKS: Book[] = [
  { width: 18, height: 86, colour: "var(--spine-7)" },
  { width: 12, height: 78, colour: "var(--spine-2)", style: "stripe" },
  { width: 22, height: 97, colour: "var(--spine-4)", style: "panel" },
  { width: 10, height: 62, colour: "var(--spine-9)", style: "dots" },
  { width: 16, height: 84, colour: pale("5"), style: "panel", light: true },
  { width: 13, height: 76, colour: "var(--spine-1)" },
  { width: 19, height: 88, colour: "var(--spine-6)", style: "panel" },
  { width: 11, height: 66, colour: "var(--spine-3)", style: "dots" },
  { width: 15, height: 80, colour: "var(--spine-8)", style: "stripe", lean: 7 },

  // Everything past here needs a shelf wider than a phone.
  {
    width: 24,
    height: 99,
    colour: "var(--spine-10)",
    style: "panel",
    gapBefore: true,
    wide: true,
  },
  { width: 12, height: 74, colour: pale("9", 55), light: true, wide: true },
  {
    width: 17,
    height: 82,
    colour: "var(--spine-5)",
    style: "panel",
    wide: true,
  },
  { width: 9, height: 60, colour: "var(--spine-4)", wide: true },
  {
    width: 21,
    height: 92,
    colour: "var(--spine-1)",
    style: "stripe",
    wide: true,
  },
  {
    width: 14,
    height: 79,
    colour: pale("6"),
    style: "dots",
    light: true,
    wide: true,
  },
  { width: 11, height: 64, colour: "var(--spine-2)", wide: true },
  {
    width: 20,
    height: 87,
    colour: "var(--spine-9)",
    style: "panel",
    wide: true,
  },
  {
    width: 16,
    height: 83,
    colour: "var(--spine-3)",
    style: "stripe",
    wide: true,
  },
  { width: 10, height: 59, colour: pale("7", 60), light: true, wide: true },
  {
    width: 23,
    height: 91,
    colour: "var(--spine-6)",
    style: "panel",
    wide: true,
  },
];

function Printing({ book, ink }: { book: Book; ink: string }) {
  if (book.style === "dots") {
    return (
      <span className="flex flex-col items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: ink }}
          />
        ))}
      </span>
    );
  }

  if (book.style === "panel") {
    return (
      <span
        className="h-1/3 w-[62%] rounded-[1px]"
        style={{ backgroundColor: ink }}
      />
    );
  }

  if (book.style === "stripe") {
    return (
      <span
        className="w-full"
        style={{
          height: 7,
          backgroundColor: book.light
            ? "var(--spine-seam)"
            : "var(--page-edge)",
        }}
      />
    );
  }

  return <span />;
}

export function BookshelfStrip() {
  return (
    <div aria-hidden className="w-full overflow-hidden">
      <div className="flex flex-nowrap items-end justify-center gap-px px-2 sm:px-4">
        {BOOKS.map((book, i) => {
          const ink = book.light ? "var(--spine-seam)" : "var(--spine-band)";
          return (
            <span
              key={i}
              className={cn(
                "flex shrink-0 flex-col items-center justify-between rounded-t-md py-2",
                book.wide && "hidden sm:flex",
              )}
              style={{
                width: book.width,
                height: book.height,
                backgroundColor: book.colour,
                marginInlineStart: book.gapBefore ? 10 : undefined,
                transform: book.lean ? `rotate(${book.lean}deg)` : undefined,
                transformOrigin: "bottom right",
                boxShadow:
                  "inset -3px 0 0 var(--page-edge), inset 1px 0 0 var(--spine-seam)",
              }}
            >
              {/* The bands a hardback has stamped near its ends. */}
              <span className="h-px w-3/5" style={{ backgroundColor: ink }} />
              <Printing book={book} ink={ink} />
              <span className="h-px w-3/5" style={{ backgroundColor: ink }} />
            </span>
          );
        })}
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
