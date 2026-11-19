import { cn } from "@/lib/utils";

/**
 * The wooden plank everything in this app stands on.
 *
 * Seen straight on you get three bands: the lit top face, the darker front
 * edge below it, and the shadow the board throws on the wall. A single flat
 * fill reads as a coloured bar rather than a board, which is why the front
 * edge is a gradient.
 *
 * `size`:
 * - `"shelf"` — the real thing, under a row of books or cards.
 * - `"rail"`  — the same board seen as trim, for the app's own chrome, where
 *   a full shelf would shout over the content it is framing.
 */
export function Plank({
  size = "shelf",
  className,
}: {
  size?: "shelf" | "rail";
  className?: string;
}) {
  const shelf = size === "shelf";

  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      <div
        className={shelf ? "h-1.5 rounded-t-[3px]" : "h-[2px]"}
        style={{
          backgroundColor: "var(--shelf-wood-lit)",
          // Where whatever stands here meets the wood.
          boxShadow: "inset 0 2px 3px -2px var(--shelf-contact)",
        }}
      />
      <div
        className={shelf ? "h-3 rounded-b-[3px]" : "h-[3px]"}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--shelf-wood), var(--shelf-wood-edge))",
          boxShadow: shelf
            ? "0 7px 14px -8px var(--shelf-contact)"
            : "0 4px 10px -7px var(--shelf-contact)",
        }}
      />
    </div>
  );
}
