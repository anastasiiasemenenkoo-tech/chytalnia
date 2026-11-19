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
 * mouth. They are a hand-arranged set rather than a generated one, so the row
 * looks stacked by a person: a couple of fat hardbacks, a run of thin ones,
 * a gap in the middle where something was pulled out.
 */
const SPINES = [
  { width: 22, height: 88, colour: "var(--spine-7)" },
  { width: 16, height: 76, colour: "var(--spine-2)" },
  { width: 15, height: 80, colour: "var(--spine-4)" },
  { width: 26, height: 92, colour: "var(--spine-9)" },
  // Leaning into the gap, the way the last book in a row does.
  { width: 14, height: 68, colour: "var(--spine-5)", lean: 7 },
  // The gap. Somebody is reading that one.
  { width: 20, height: 84, colour: "var(--spine-1)", gapBefore: true },
  { width: 17, height: 72, colour: "var(--spine-6)" },
  { width: 24, height: 90, colour: "var(--spine-3)" },
  { width: 15, height: 64, colour: "var(--spine-10)" },
  { width: 19, height: 78, colour: "var(--spine-8)" },
];

export function BookshelfStrip() {
  return (
    <div aria-hidden className="w-full overflow-hidden">
      <div className="flex flex-nowrap items-end justify-center gap-px px-4">
        {SPINES.map((spine, i) => (
          <span
            key={i}
            className="flex shrink-0 flex-col items-center justify-between rounded-t-md py-2"
            style={{
              width: spine.width,
              height: spine.height,
              backgroundColor: spine.colour,
              marginInlineStart: spine.gapBefore ? 10 : undefined,
              transform: spine.lean ? `rotate(${spine.lean}deg)` : undefined,
              transformOrigin: "bottom right",
              boxShadow:
                "inset -3px 0 0 var(--page-edge), inset 1px 0 0 var(--spine-seam)",
            }}
          >
            {/* The two bands a hardback has stamped near its ends. */}
            <span
              className="h-px w-3/5"
              style={{ backgroundColor: "var(--spine-band)" }}
            />
            <span
              className="h-px w-3/5"
              style={{ backgroundColor: "var(--spine-band)" }}
            />
          </span>
        ))}
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
