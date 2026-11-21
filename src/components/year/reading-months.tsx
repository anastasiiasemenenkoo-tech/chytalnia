import { Plank } from "@/components/decor/plank";

/**
 * The year as a shelf: one spine per month, as tall as the books finished in
 * it. A chart library would have drawn a bar chart; this app already owns a
 * vocabulary for "books standing in a row", so the year is told in it.
 *
 * A month with nothing read keeps its slot and shows the bare board. Hiding
 * it would quietly flatter the reader, and an empty February is part of the
 * year too.
 */
const TALLEST = 108;
const SHORTEST = 6;

export function ReadingMonths({
  byMonth,
  labels,
}: {
  byMonth: number[];
  /** Short month names, already in the reader's language. */
  labels: string[];
}) {
  const peak = Math.max(...byMonth, 1);

  return (
    <div>
      <div
        className="flex items-end justify-between gap-1 px-1"
        style={{ height: TALLEST }}
      >
        {byMonth.map((count, month) => (
          <div
            key={month}
            className="flex flex-1 flex-col items-center justify-end gap-1"
          >
            {count > 0 ? (
              <span className="text-muted-foreground text-[10px] tabular-nums">
                {count}
              </span>
            ) : null}
            <span
              className="w-full"
              style={{
                height:
                  count > 0
                    ? Math.max(SHORTEST, Math.round((count / peak) * (TALLEST - 18)))
                    : 2,
                backgroundColor:
                  count > 0
                    ? `var(--spine-${(month % 9) + 1})`
                    : "var(--spine-seam)",
                // Square tops and a seam down the left edge, the same way the
                // books on every other shelf in this app are cut.
                boxShadow: count > 0 ? "inset 1px 0 0 var(--spine-seam)" : undefined,
              }}
            />
          </div>
        ))}
      </div>
      <Plank />
      <div className="flex justify-between gap-1 px-1 pt-2">
        {labels.map((label, month) => (
          <span
            key={month}
            className="text-muted-foreground flex-1 text-center text-[10px] capitalize"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
