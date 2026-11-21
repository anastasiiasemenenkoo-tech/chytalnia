import { Suspense } from "react";
import { Search } from "lucide-react";

import { SearchResults } from "@/components/books/search-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { CYRILLIC, findBooks } from "@/lib/openlibrary";
import { requireCurrentUser } from "@/lib/session";

/**
 * A Cyrillic query asks Open Library, asks Wikidata what the name is in
 * English, and asks Open Library again. Open Library alone can take seconds
 * to answer that it has never heard of a name, and on the platform default
 * the whole page timed out and the reader got the error screen instead of
 * their books.
 */
export const maxDuration = 60;

export default async function BookSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Before the search, not after: the layout turns signed-out visitors away,
  // but it does so in parallel with this page, so without this an open URL
  // could send this app out to two public APIs on behalf of nobody.
  await requireCurrentUser();
  const dict = await getDictionary();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.books.searchTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {dict.books.searchSubtitle}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-2" action="/books/search">
            <Input
              type="search"
              name="q"
              placeholder={dict.books.searchPlaceholder}
              defaultValue={query}
              autoFocus
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              {dict.books.search}
            </Button>
          </form>
        </CardContent>
      </Card>

      {query ? (
        // The form above is on screen while the catalogues are still being
        // asked, rather than the browser sitting on the old page for five
        // seconds with nothing to show for the click. `key` restarts the
        // wait when the query changes.
        <Suspense key={query} fallback={<Searching text={dict.books.searching} />}>
          <Results query={query} />
        </Suspense>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            {dict.books.typeToBegin}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function Results({ query }: { query: string }) {
  const dict = await getDictionary();
  const { hits, searchedAs } = await findBooks(query);

  return (
    <div className="space-y-4">
      {/* Said out loud: these books are filed under another name, and the
          reader should know which one before adding them to a shelf. */}
      {searchedAs ? (
        <p className="text-muted-foreground text-sm">
          {interpolate(dict.books.searchedAs, { query: searchedAs })}
        </p>
      ) : null}
      {/* Searched in Ukrainian, answered in English — which looks like a
          bug and is not one. Only when the catalogue answered the query as
          typed: when it was translated, the line above already explains it. */}
      {!searchedAs && hits.length > 0 && CYRILLIC.test(query) ? (
        <p className="text-muted-foreground text-sm">
          {dict.books.catalogueLanguage}
        </p>
      ) : null}
      <SearchResults hits={hits} />
    </div>
  );
}

function Searching({ text }: { text: string }) {
  return (
    <ul
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label={text}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li
          key={i}
          className="bg-card flex animate-pulse gap-4 rounded-lg border p-4"
        >
          <div className="bg-muted h-[120px] w-20 shrink-0 rounded" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="bg-muted h-3.5 w-4/5 rounded" />
            <div className="bg-muted h-3 w-1/2 rounded" />
            <div className="bg-muted mt-auto h-8 w-28 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
