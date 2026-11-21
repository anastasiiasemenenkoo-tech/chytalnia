import { AddToShelfButton } from "@/components/books/add-to-shelf-button";
import { BookCover } from "@/components/books/book-cover";
import { ManualEntryDialog } from "@/components/books/manual-entry-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import type { OpenLibraryHit } from "@/lib/openlibrary";

export async function SearchResults({ hits }: { hits: OpenLibraryHit[] }) {
  const dict = await getDictionary();

  if (hits.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground space-y-4 py-12 text-center text-sm">
          <p>{dict.books.noResults}</p>
          {/* Open Library is an English-language catalogue and simply does
              not have a lot of Ukrainian publishing, so a search that finds
              nothing is often right about the catalogue and wrong about the
              book. The book still has to be able to reach a shelf. */}
          <p>{dict.books.noResultsManual}</p>
          <div className="flex justify-center">
            <ManualEntryDialog />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hits.map((hit) => (
        <li
          key={hit.olid}
          className="bg-card text-card-foreground flex gap-4 rounded-lg border p-4"
        >
          <div className="w-20 shrink-0">
            <BookCover src={hit.coverUrl} alt={hit.title} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-sm leading-snug font-medium">{hit.title}</h3>
            <p className="text-muted-foreground truncate text-xs">
              {hit.author}
            </p>
            <div className="mt-auto pt-3">
              <AddToShelfButton
                olid={hit.olid}
                title={hit.title}
                author={hit.author}
                coverUrl={hit.coverUrl}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
