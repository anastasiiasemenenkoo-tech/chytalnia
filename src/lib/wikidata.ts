/**
 * A bridge from Ukrainian to the names Open Library actually indexes.
 *
 * Open Library knows Cyrillic by accident rather than by design: "Стівен Кінг"
 * returns hundreds of books, "Бакман" returns nothing at all, and a reader has
 * no way of telling which kind of name they are holding. Wikidata, on the
 * other hand, is built out of labels in every language, so it can say that
 * "Фредрік Бакман" and "Fredrik Backman" are one person — and that
 * "Чоловік на ім'я Уве" is the book catalogued as "A Man Called Ove".
 *
 * So we ask Wikidata what the query is called in English and search again.
 * No API key, no account: the action API is open.
 */

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

/** Labels do not change. A month is conservative. */
const A_MONTH = 60 * 60 * 24 * 30;

const UA = { "User-Agent": "reader-dashboard (learning project)" };

/**
 * `instance of` values worth taking to a library catalogue: people, and the
 * things people write. Wikidata's own relevance order puts a village in
 * Minnesota above a Swedish novelist for the query "Бакман", so a candidate
 * that is a person or a work is tried first.
 */
const PEOPLE_AND_WORKS = new Set([
  "Q5", // human
  "Q7725634", // literary work
  "Q571", // book
  "Q8261", // novel
  "Q47461344", // written work
  "Q49084", // short story
  "Q1667921", // novel series
  "Q277759", // book series
  "Q3331189", // version, edition or translation
]);

type SearchResponse = { search?: { id?: string }[] };

type Claim = {
  mainsnak?: { datavalue?: { value?: { id?: string } } };
};

type EntitiesResponse = {
  entities?: Record<
    string,
    {
      labels?: Record<string, { value?: string }>;
      claims?: Record<string, Claim[]>;
    }
  >;
};

async function wikidata<T>(params: Record<string, string>): Promise<T | null> {
  const url = `${WIKIDATA_API}?${new URLSearchParams({ ...params, format: "json" })}`;
  try {
    // Cached hard: the same misspelt author gets typed by many readers, and
    // Wikidata is a volunteer-funded service we are a guest of.
    const res = await fetch(url, {
      headers: UA,
      next: { revalidate: A_MONTH },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // A search that finds nothing is a worse outcome than a search that finds
    // nothing *and* logs a stack trace, but only slightly. Never throw: this
    // runs as a bonus pass after a search that already came back empty.
    return null;
  }
}

/**
 * What a Cyrillic query might be called in English, best guess first.
 *
 * Returns at most `limit` names, and an empty list for anything it cannot
 * answer — no match, no English label, Wikidata unreachable.
 */
export async function englishNamesFor(
  query: string,
  limit = 3,
): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];

  const found = await wikidata<SearchResponse>({
    action: "wbsearchentities",
    search: q,
    language: "uk",
    uselang: "uk",
    type: "item",
    limit: "7",
  });

  const ids = (found?.search ?? [])
    .map((hit) => hit.id)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const entities = await wikidata<EntitiesResponse>({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "labels|claims",
    languages: "en",
  });
  if (!entities?.entities) return [];

  // Keep Wikidata's relevance order within each group, but let people and
  // books jump the queue ahead of villages and surname pages.
  const likely: string[] = [];
  const rest: string[] = [];

  for (const id of ids) {
    const entity = entities.entities[id];
    const label = entity?.labels?.en?.value?.trim();
    if (!label) continue;

    const kinds = (entity?.claims?.P31 ?? [])
      .map((claim) => claim.mainsnak?.datavalue?.value?.id)
      .filter((kind): kind is string => Boolean(kind));

    (kinds.some((kind) => PEOPLE_AND_WORKS.has(kind)) ? likely : rest).push(
      label,
    );
  }

  return [...new Set([...likely, ...rest])].slice(0, limit);
}
