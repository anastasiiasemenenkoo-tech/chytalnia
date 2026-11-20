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

  const res = await fetch(url, {
    headers: { "User-Agent": "reader-dashboard (learning project)" },
    // The same titles get typed over and over, and Open Library is donated
    // infrastructure. An hour-old answer about a published book is fine.
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { docs?: RawDoc[] };
  const docs = data.docs ?? [];

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

const CYRILLIC = /\p{Script=Cyrillic}/u;

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

  const direct = await searchOpenLibrary(q, limit);
  if (direct.length > 0 || !CYRILLIC.test(q)) {
    return { hits: direct, searchedAs: null };
  }

  for (const name of await englishNamesFor(q)) {
    const hits = await searchOpenLibrary(name, limit);
    if (hits.length > 0) return { hits, searchedAs: name };
  }

  return { hits: [], searchedAs: null };
}
