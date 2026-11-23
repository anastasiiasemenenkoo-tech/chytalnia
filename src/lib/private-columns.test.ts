import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The privacy policy promises that a reader's private notes reach nobody
 * else. That promise is kept by every query naming the columns it wants —
 * and broken, quietly, by any query that doesn't.
 *
 * `include: { … }` leaves the scalar fields at their default, which is
 * **all of them**. A club's review list was written that way and was reading
 * every member's `notes` in order to print their rating. Nothing rendered
 * them, so nothing looked wrong; it was one `<Something review={r} />` away
 * from putting private notes in the payload for every member to read. The
 * same default is what took password sign-in down when `googleSub` was added
 * to the schema before its migration ran.
 *
 * So: every `userBook` query says `select`. Reading the signed-in reader's
 * own rows is the one case where the whole row is fair game, and those files
 * are listed here by name — a list that should stay short, and that is the
 * point of writing it down.
 */
const OWN_ROWS_ONLY = [
  // The reader's own shelves: notes are theirs, and the dialog edits them.
  "src/app/(app)/books/page.tsx",
  // The dashboard's "currently reading" — also the reader's own.
  "src/app/(app)/dashboard/page.tsx",
];

const ROOTS = ["src/app", "src/components", "src/lib", "src/actions"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(path) || path.includes(".test.")) return [];
    return [path];
  });
}

/**
 * The **top-level** keys of a call's argument object.
 *
 * Top-level is the whole point. The first version of this test asked whether
 * the argument text contained "select:" anywhere, and the real bug slipped
 * straight through it: `include: { user: { select: { … } } }` contains the
 * word, nested two levels down, while the query itself still selected every
 * scalar column. A test that passes on the bug it was written for is worse
 * than no test, so this walks the braces and only counts keys at depth one.
 */
function topLevelKeys(source: string, from: number): string[] {
  const open = source.indexOf("{", from);
  if (open === -1) return [];

  const keys: string[] = [];
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (char === "{") {
      depth++;
      continue;
    }
    if (char === "}") {
      depth--;
      if (depth === 0) break;
      continue;
    }
    if (depth !== 1) continue;
    const key = /^([A-Za-z_$][\w$]*)\s*:/.exec(source.slice(i));
    if (key) {
      keys.push(key[1]);
      i += key[0].length - 1;
    }
  }
  return keys;
}

function userBookQueries(source: string): string[][] {
  const calls: string[][] = [];
  const pattern = /userBook\.(findMany|findFirst|findUnique)\(/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    calls.push(topLevelKeys(source, match.index + match[0].length - 1));
  }
  return calls;
}

describe("private columns are never fetched by accident", () => {
  const files = ROOTS.flatMap(sourceFiles);

  it("finds the queries it is supposed to be checking", () => {
    // A guard on the guard: if the search stops matching, this test would
    // pass by checking nothing at all.
    const withQueries = files.filter((f) =>
      userBookQueries(readFileSync(f, "utf8")).length > 0,
    );
    expect(withQueries.length).toBeGreaterThanOrEqual(5);
  });

  it("every query over somebody's shelves names its columns", () => {
    const offenders = files
      .filter((file) => !OWN_ROWS_ONLY.includes(file))
      .filter((file) =>
        userBookQueries(readFileSync(file, "utf8")).some(
          (keys) => !keys.includes("select"),
        ),
      );

    expect(
      offenders,
      "These read UserBook rows without naming their columns, so they fetch " +
        "every one — private notes included. Add an explicit `select`, or " +
        "add the file to OWN_ROWS_ONLY if it only ever reads the signed-in " +
        "reader's own rows.",
    ).toEqual([]);
  });
});
