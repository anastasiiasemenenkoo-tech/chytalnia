/**
 * How a book title becomes a colour.
 *
 * Lives here rather than in `book-spine.tsx` so server components can draw a
 * spine too: a club card and the shelves on /books have to agree about what
 * colour a given book is, or the same book turns up wearing two jackets.
 */

const SPINE_COLOURS = 10;

/**
 * Stable per-title hash. Two books never swap colours between renders or
 * between server and client, which a random pick would.
 *
 * FNV-1a rather than the usual `hash * 31 + c`: that one barely mixes the
 * low bits, and a shelf of similar Ukrainian titles came out four shades of
 * the same olive.
 */
export function hashTitle(title: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < title.length; i++) {
    hash ^= title.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function spineColour(title: string) {
  return `var(--spine-${(hashTitle(title) % SPINE_COLOURS) + 1})`;
}
