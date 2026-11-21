import Link from "next/link";
import { Star } from "lucide-react";

import { ReadingMonths } from "@/components/year/reading-months";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { plural } from "@/i18n/plural";
import { requireCurrentUser } from "@/lib/session";
import { yearInReview } from "@/lib/year-in-review";
import { cn } from "@/lib/utils";

export default async function YearPage() {
  const user = await requireCurrentUser();
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const year = new Date().getFullYear();
  const review = await yearInReview(user.id, year);

  const tag = locale === "uk" ? "uk-UA" : "en-US";
  const number = new Intl.NumberFormat(tag);
  const monthsShort = Array.from({ length: 12 }, (_, m) =>
    new Intl.DateTimeFormat(tag, { month: "short" }).format(new Date(2026, m, 1)),
  );
  const monthsLong = Array.from({ length: 12 }, (_, m) =>
    new Intl.DateTimeFormat(tag, { month: "long" }).format(new Date(2026, m, 1)),
  );

  const heading = (
    <div>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {interpolate(dict.year.title, { year })}
      </h1>
      <p className="text-muted-foreground text-sm">{dict.year.subtitle}</p>
    </div>
  );

  if (review.finished === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        {heading}
        <Card>
          <CardContent className="text-muted-foreground space-y-4 py-12 text-center text-sm">
            <p>{dict.year.empty}</p>
            <Link href="/books/search" className={cn(buttonVariants())}>
              {dict.year.emptyAction}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Said plainly rather than with an arrow: the sentence is the point, and a
  // reader who read less than last year should not be shown a red triangle.
  const lastYear =
    review.finishedLastYear === 0
      ? dict.year.lastYearNone
      : review.finished > review.finishedLastYear
        ? interpolate(dict.year.lastYearMore, {
            count: plural(dict.year.booksRead, review.finishedLastYear, locale),
          })
        : review.finished === review.finishedLastYear
          ? dict.year.lastYearSame
          : interpolate(dict.year.lastYearFewer, {
              count: plural(
                dict.year.booksRead,
                review.finishedLastYear,
                locale,
              ),
            });

  const ratedPeak = Math.max(...review.ratings, 1);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {heading}

      {/* The one card worth a screenshot: the two numbers, large. */}
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-heading text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {plural(dict.year.booksRead, review.finished, locale)}
          </p>
          {review.booksWithPages > 0 ? (
            <p className="mt-3 text-lg tabular-nums">
              {plural(
                dict.year.pagesRead,
                review.pages,
                locale,
                number.format(review.pages),
              )}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-4 text-xs">{lastYear}</p>
          {review.booksWithPages === 0 ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {dict.year.pagesNone}
            </p>
          ) : review.booksWithPages < review.finished ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {dict.year.pagesPartial}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Section title={dict.year.monthsTitle}>
        <ReadingMonths byMonth={review.byMonth} labels={monthsShort} />
        {/* Only when one month actually won. Two months tied for the top is
            not "evenly all year", and naming both says nothing either. */}
        {review.bestMonth !== null ? (
          <p className="text-muted-foreground pt-3 text-xs">
            {interpolate(dict.year.bestMonth, {
              month: monthsLong[review.bestMonth],
            })}
          </p>
        ) : null}
      </Section>

      {review.topAuthors.length > 0 ? (
        <Section title={dict.year.authorsTitle}>
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
        </Section>
      ) : null}

      <Section title={dict.year.ratingsTitle}>
        {review.averageRating === null ? (
          <p className="text-muted-foreground text-sm">{dict.year.noRatings}</p>
        ) : (
          <>
            <ul className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = review.ratings[stars - 1];
                return (
                  <li key={stars} className="flex items-center gap-2">
                    <span className="flex w-16 shrink-0 items-center gap-0.5">
                      {Array.from({ length: stars }, (_, i) => (
                        <Star
                          key={i}
                          className="h-2.5 w-2.5"
                          style={{ fill: "var(--spine-foil)" }}
                          stroke="none"
                        />
                      ))}
                    </span>
                    <span
                      className="h-2.5 rounded-sm"
                      style={{
                        width: `${(count / ratedPeak) * 100}%`,
                        minWidth: count > 0 ? 6 : 0,
                        backgroundColor: "var(--spine-3)",
                      }}
                    />
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {count > 0 ? count : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-muted-foreground pt-3 text-xs">
              {interpolate(dict.year.averageRating, {
                value: review.averageRating.toFixed(1),
              })}
            </p>
          </>
        )}
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        {review.longest ? (
          <Section title={dict.year.longestTitle}>
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
          </Section>
        ) : null}

        {review.fastest ? (
          <Section title={dict.year.fastestTitle}>
            <p className="text-sm leading-snug font-medium">
              {review.fastest.title}
            </p>
            <p className="text-muted-foreground text-xs">
              {review.fastest.author}
            </p>
            <p className="text-muted-foreground pt-2 text-xs">
              {review.fastest.days === 0
                ? dict.year.fastestSameDay
                : plural(dict.year.fastestDays, review.fastest.days, locale)}
            </p>
          </Section>
        ) : null}
      </div>

      <Section title={dict.year.goalTitle}>
        <p className="text-sm">
          {review.goal === null
            ? dict.year.goalNone
            : review.finished >= review.goal
              ? interpolate(dict.year.goalMet, { goal: review.goal })
              : interpolate(dict.year.goalMissed, { goal: review.goal })}
        </p>
      </Section>

      {review.setAside > 0 ? (
        <p className="text-muted-foreground text-center text-xs">
          {interpolate(dict.year.setAside, {
            count: plural(dict.year.booksRead, review.setAside, locale),
          })}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-muted-foreground mb-4 text-xs tracking-wide uppercase">
          {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  );
}
