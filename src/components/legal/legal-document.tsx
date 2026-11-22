import Link from "next/link";
import { BookOpen } from "lucide-react";

import type { LegalDocument } from "@/content/legal-types";
import { Plank } from "@/components/decor/plank";

/**
 * Lays out either of the two legal documents. Plain prose on the page
 * background — no card, because a wall of small text inside a card reads as
 * fine print, and fine print is the opposite of what these are for.
 *
 * A `todo` block is drawn so it cannot be missed: these pages go up before
 * the blanks are filled, and an Impressum with a blank where the address
 * belongs has to look wrong to whoever opens it.
 */
export function LegalDocumentView({
  doc,
  locale,
  brand,
  backLabel,
  todoLabel,
}: {
  doc: LegalDocument;
  locale: string;
  brand: string;
  backLabel: string;
  todoLabel: string;
}) {
  const updated = new Intl.DateTimeFormat(
    locale === "uk" ? "uk-UA" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  ).format(new Date(doc.updated));

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="px-6 py-5">
        <Link
          href="/"
          className="font-heading inline-flex items-center gap-2 text-lg font-semibold"
        >
          <BookOpen className="h-5 w-5" />
          {brand}
        </Link>
      </header>
      <Plank size="rail" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {doc.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">{doc.lead}</p>
        <p className="text-muted-foreground/70 mt-2 text-xs">{updated}</p>

        <div className="mt-10 space-y-10">
          {doc.sections.map((section) => (
            <section key={section.id} className="space-y-3">
              <h2 className="font-heading text-base font-medium">
                {section.heading}
              </h2>
              {section.blocks.map((block, i) => {
                if (block.kind === "text") {
                  return (
                    <p key={i} className="text-sm leading-relaxed">
                      {block.text}
                    </p>
                  );
                }
                if (block.kind === "list") {
                  return (
                    <ul key={i} className="ml-5 list-disc space-y-1.5 text-sm">
                      {block.items.map((item) => (
                        <li key={item} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (block.kind === "pairs") {
                  return (
                    <dl key={i} className="space-y-3 text-sm">
                      {block.pairs.map((pair) => (
                        <div key={pair.term}>
                          <dt className="font-medium">{pair.term}</dt>
                          <dd className="text-muted-foreground leading-relaxed">
                            {pair.detail}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  );
                }
                return (
                  <p
                    key={i}
                    data-testid="legal-todo"
                    className="border-destructive/50 bg-destructive/5 rounded-md border border-dashed px-3 py-2 text-sm"
                  >
                    <span className="text-destructive mr-2 text-xs font-semibold tracking-wide uppercase">
                      {todoLabel}
                    </span>
                    {block.text}
                  </p>
                );
              })}
            </section>
          ))}
        </div>

        <Link
          href="/"
          className="text-muted-foreground mt-12 inline-block text-sm underline"
        >
          {backLabel}
        </Link>
      </main>
    </div>
  );
}
