import { spineColour } from "@/lib/spine";
import { cn } from "@/lib/utils";

/**
 * A book's spine, standing where the whole book would not fit — down the side
 * of a club card, or beside a line in a list.
 *
 * It takes its colour from the same hash the shelves on `/books` use, so a
 * book is recognisable wherever it turns up rather than wearing a different
 * jacket on every page. The title is real text, not decoration: it is what a
 * screen reader announces, and what you read when you tilt your head.
 *
 * `title` of `null` means the club has not chosen a book, and the slot stays
 * empty rather than collapsing — an empty slot on a shelf is a thing you can
 * see, and the cards stay aligned.
 */
export function Spine({
  title,
  label,
  silent,
  className,
}: {
  title: string | null;
  /** Tooltip text; the bare title is used when this is left out. */
  label?: string;
  /**
   * Set where the same title is already written out beside the spine, so a
   * screen reader does not read the book twice.
   */
  silent?: boolean;
  className?: string;
}) {
  if (!title) {
    return (
      <div
        aria-hidden
        className={cn(
          "bg-muted/60 border-border shrink-0 border-r border-dashed",
          className,
        )}
      />
    );
  }

  return (
    <div
      title={label ?? title}
      className={cn(
        "flex shrink-0 flex-col items-center justify-between py-2",
        className,
      )}
      style={{ backgroundColor: spineColour(title) }}
    >
      {/* The two bands a hardback has stamped near its ends. */}
      <span
        aria-hidden
        className="h-px w-1/2"
        style={{ backgroundColor: "var(--spine-band)" }}
      />
      <span
        aria-hidden={silent || undefined}
        className="flex min-h-0 flex-1 items-center overflow-hidden py-1.5 text-[11px] leading-tight font-medium"
        style={{
          color: "var(--spine-ink)",
          // Vertical-rl alone reads top-down; the flip makes the title climb
          // the spine the way it does on a real shelf.
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        <span className="truncate">{title}</span>
      </span>
      <span
        aria-hidden
        className="h-px w-1/2"
        style={{ backgroundColor: "var(--spine-band)" }}
      />
    </div>
  );
}
