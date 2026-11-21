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

/** Short enough that a silent Wikidata cannot hold up the page. */
const TIMEOUT_MS = 5000;

/** `instance of` values that are the thing itself: a book, not a person. */
const WORKS = new Set([
  "Q7725634", // literary work
  "Q571", // book
  "Q8261", // novel
  "Q47461344", // written work
  "Q49084", // short story
  "Q1667921", // novel series
  "Q277759", // book series
  "Q3331189", // version, edition or translation
]);

/** human */
const PERSON = "Q5";

/**
 * Occupations that put a person in a library catalogue.
 *
 * Wikidata's relevance order for "Бакман" is a town in Minnesota, then a
 * boxer, then a disambiguation page, and only fourth the Swedish novelist
 * the reader meant. Grouping by `instance of` alone is not enough — the
 * boxer is as human as the novelist — so what the person did for a living
 * decides between them.
 */
const WRITERS = new Set([
  "Q36180", // writer
  "Q482980", // author
  "Q6625963", // novelist
  "Q49757", // poet
  "Q214917", // playwright
  "Q4853732", // children's writer
  "Q12144794", // non-fiction writer
  "Q11774202", // essayist
  "Q28389", // screenwriter
  "Q1930187", // journalist
  "Q18814623", // autobiographer
  "Q6051619", // memoirist
  "Q13570226", // translator
  "Q201788", // historian
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
      signal: AbortSignal.timeout(TIMEOUT_MS),
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

  // Three tiers, each keeping Wikidata's own order inside it: whoever writes
  // books, then anyone else who is a person, then villages and surname
  // pages. Every name still gets tried — this only decides who goes first,
  // and going first is what spares the catalogue two more lookups.
  const writers: string[] = [];
  const people: string[] = [];
  const rest: string[] = [];

  for (const id of ids) {
    const entity = entities.entities[id];
    const label = entity?.labels?.en?.value?.trim();
    if (!label) continue;

    const claimed = (property: string) =>
      (entity?.claims?.[property] ?? [])
        .map((claim) => claim.mainsnak?.datavalue?.value?.id)
        .filter((value): value is string => Boolean(value));

    const kinds = claimed("P31");
    const jobs = claimed("P106");

    if (jobs.some((job) => WRITERS.has(job)) || kinds.some((k) => WORKS.has(k))) {
      writers.push(label);
    } else if (kinds.includes(PERSON)) {
      people.push(label);
    } else {
      rest.push(label);
    }
  }

  return [...new Set([...writers, ...people, ...rest])].slice(0, limit);
}
