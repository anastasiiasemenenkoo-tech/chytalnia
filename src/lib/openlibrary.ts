import { englishNamesFor } from "@/lib/wikidata";

export type OpenLibraryHit = {
  olid: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

type RawDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
};

/** Long enough for a slow answer, short enough to leave room for another. */
const SEARCH_TIMEOUT_MS = 7000;

export function coverUrlFromId(coverId: number, size: "S" | "M" | "L" = "M") {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function searchOpenLibrary(
  query: string,
  limit = 12,
): Promise<OpenLibraryHit[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `https://openlibrary.org/search.json?` +
    new URLSearchParams({
      q,
      limit: String(limit),
      fields: "key,title,author_name,cover_i",
    }).toString();

  let docs: RawDoc[];
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "reader-dashboard (learning project)" },
      // The same titles get typed over and over, and Open Library is donated
      // infrastructure. An hour-old answer about a published book is fine.
      next: { revalidate: 3600 },
      // Open Library can take four seconds to say it has never heard of a
      // name, and occasionally it does not answer at all. Unbounded, one
      // slow lookup took the whole page down with it.
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    docs = ((await res.json()) as { docs?: RawDoc[] }).docs ?? [];
  } catch {
    // Timed out, unreachable, or answered with something that is not JSON.
    // A search that finds nothing is a page; an exception is a crash.
    return [];
  }

  return docs
    .filter((d) => d.key && d.title)
    .map((d) => ({
      olid: d.key!.replace(/^\/works\//, ""),
      title: d.title!,
      author: d.author_name?.[0] ?? "Unknown",
      coverUrl: d.cover_i ? coverUrlFromId(d.cover_i) : null,
    }));
}

export type BookSearch = {
  hits: OpenLibraryHit[];
  /**
   * The name actually taken to Open Library, when it isn't what the reader
   * typed. The page says so out loud rather than quietly showing books under
   * titles nobody asked for.
   */
  searchedAs: string | null;
};

export const CYRILLIC = /\p{Script=Cyrillic}/u;

/**
 * Search the way a Ukrainian reader expects it to work.
 *
 * The typed query goes to Open Library first, always — it does know some
 * Cyrillic, and a direct hit is the honest answer. Only when a Cyrillic query
 * comes back empty do we ask Wikidata for English names and try those, taking
 * the first that finds anything. A Latin query that finds nothing is simply
 * not in the catalogue, so there is nothing to translate.
 */
export async function findBooks(
  query: string,
  limit = 12,
): Promise<BookSearch> {
  const q = query.trim();
  if (!q) return { hits: [], searchedAs: null };

  // A Latin query never needs the bridge, and asking Wikidata about one
  // would only hang a round trip off a search that already works.
  if (!CYRILLIC.test(q)) {
    return { hits: await searchOpenLibrary(q, limit), searchedAs: null };
  }

  // Both questions at once. Open Library takes seconds to answer that it has
  // never heard of "Бакман", and waiting for that answer before so much as
  // asking Wikidata what the name is in English is where this search spent
  // its time — enough of it to time the page out on Vercel.
  const [direct, names] = await Promise.all([
    searchOpenLibrary(q, limit),
    englishNamesFor(q),
  ]);
  if (direct.length > 0) return { hits: direct, searchedAs: null };

  // The candidates go together too, and the best-ranked one that found
  // anything wins — not whichever answered first.
  const tried = await Promise.all(
    names.map(async (name) => ({
      name,
      hits: await searchOpenLibrary(name, limit),
    })),
  );
  const found = tried.find((attempt) => attempt.hits.length > 0);

  return found
    ? { hits: found.hits, searchedAs: found.name }
    : { hits: [], searchedAs: null };
}
