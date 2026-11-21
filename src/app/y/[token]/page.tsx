import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

import { ReadingMonths } from "@/components/year/reading-months";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { plural } from "@/i18n/plural";
import { yearByShareToken } from "@/lib/year-in-review";
import { cn } from "@/lib/utils";

/**
 * Somebody's year, opened by a link they handed out.
 *
 * Outside `(app)`: no session, no sidebar. What it shows is deliberately a
 * subset of the reader's own page — counts, months, authors, the two
 * notable books — and never a review, a note or an address. A visitor who
 * follows this link learns what the owner meant to tell them and nothing
 * else about their account.
 */
export default async function SharedYearPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await yearByShareToken(token);
  // A revoked link is a link that never was. Saying "this used to exist"
  // would leak the one thing the reader took back.
  if (!shared) notFound();

  const { reader, review } = shared;
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const tag = locale === "uk" ? "uk-UA" : "en-US";
  const number = new Intl.NumberFormat(tag);
  const monthsShort = Array.from({ length: 12 }, (_, m) =>
    new Intl.DateTimeFormat(tag, { month: "short" }).format(
      new Date(2026, m, 1),
    ),
  );

  return (
    <div className="bg-background flex min-h-screen flex-col items-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-1 text-lg font-semibold"
      >
        <span className="font-heading flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {dict.brand}
        </span>
        <span className="text-muted-foreground text-xs font-normal italic">
          {dict.tagline}
        </span>
      </Link>

      <div className="w-full max-w-xl space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {reader
                ? interpolate(dict.year.sharedBy, {
                    reader,
                    year: review.year,
                  })
                : interpolate(dict.year.title, { year: review.year })}
            </p>
            <p className="font-heading mt-3 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {plural(dict.year.booksRead, review.finished, locale)}
            </p>
            {review.booksWithPages > 0 ? (
              <p className="mt-2 text-lg tabular-nums">
                {plural(
                  dict.year.pagesRead,
                  review.pages,
                  locale,
                  number.format(review.pages),
                )}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-muted-foreground mb-4 text-xs tracking-wide uppercase">
              {dict.year.monthsTitle}
            </h2>
            <ReadingMonths byMonth={review.byMonth} labels={monthsShort} />
          </CardContent>
        </Card>

        {review.topAuthors.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-muted-foreground mb-4 text-xs tracking-wide uppercase">
                {dict.year.authorsTitle}
              </h2>
              <ul className="space-y-2">
                {review.topAuthors.map((entry) => (
                  <li
                    key={entry.author}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="truncate">{entry.author}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {plural(dict.year.authorBooks, entry.count, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {review.longest ? (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-muted-foreground mb-4 text-xs tracking-wide uppercase">
                {dict.year.longestTitle}
              </h2>
              <p className="text-sm leading-snug font-medium">
                {review.longest.title}
              </p>
              <p className="text-muted-foreground text-xs">
                {review.longest.author}
              </p>
              <p className="text-muted-foreground pt-2 text-xs">
                {interpolate(dict.year.longestPages, {
                  count: number.format(review.longest.pages),
                })}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* The reason this page is public at all. */}
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {dict.year.sharedCta}
            </p>
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              {dict.year.sharedCtaAction}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
