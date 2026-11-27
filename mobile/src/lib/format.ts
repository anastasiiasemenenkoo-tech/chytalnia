/**
 * Dates in Ukrainian, written out rather than left to `Intl`.
 *
 * Hermes does ship Intl on iOS, but the genitive month a Ukrainian date needs
 * ("15 листопада", not "15 листопад") is exactly the kind of thing that comes
 * out wrong when a locale is missing and nothing warns you. Twelve words is
 * cheaper than finding that out from a screenshot.
 */
const MONTHS_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

/** "15 листопада 2026", or null for a missing or unparseable date. */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

/** Whole per cent read, or null when the book has no page count. */
export function percentRead(
  pagesRead: number | null,
  totalPages: number | null,
): number | null {
  if (!pagesRead || !totalPages || totalPages <= 0) return null;
  return Math.min(100, Math.round((pagesRead / totalPages) * 100));
}
