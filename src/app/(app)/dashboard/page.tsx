import Link from "next/link";
import { Library, Search, Users } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { ShelfPlant } from "@/components/books/shelf-decor";
import { Plank } from "@/components/decor/plank";
import { YearlyGoalCard } from "@/components/dashboard/yearly-goal-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { ShelfValue } from "@/lib/validators";

const SHELVES: ShelfValue[] = ["WANT_TO_READ", "READING", "READ", "ABANDONED"];

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const dict = await getDictionary();

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);

  const [grouped, currentlyReading, clubCount, readThisYear, userRecord] =
    await Promise.all([
      prisma.userBook.groupBy({
        by: ["shelf"],
        where: { userId: user.id },
        _count: { shelf: true },
      }),
      prisma.userBook.findMany({
        where: { userId: user.id, shelf: "READING" },
        include: { book: true },
        orderBy: { addedAt: "desc" },
        take: 6,
      }),
      prisma.clubMembership.count({ where: { userId: user.id } }),
      prisma.userBook.count({
        where: {
          userId: user.id,
          shelf: "READ",
          finishedAt: { gte: yearStart },
        },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { yearlyGoal: true },
      }),
    ]);

  const counts = Object.fromEntries(
    grouped.map((g) => [g.shelf, g._count.shelf]),
  ) as Partial<Record<ShelfValue, number>>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.dashboard.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {dict.dashboard.subtitle}
        </p>
      </div>

      {/* The counts stand on the same board the books on /books stand on, so
          the first screen belongs to the same room as the shelves. */}
      <section>
        {/* One row, never a wrapped grid: a shelf has one board, and five
            stacked boxes with a plank under the last of them reads as a stray
            brown bar. The tiles stretch to fill a wide screen and scroll on a
            narrow one, exactly as the shelves on /books do. */}
        <div className="flex items-end gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SHELVES.map((shelf) => (
            <CountTile
              key={shelf}
              href={`/books?shelf=${shelf}`}
              label={dict.shelves[shelf]}
              count={counts[shelf] ?? 0}
            />
          ))}
          <CountTile
            href="/clubs"
            label={dict.dashboard.bookClubsCard}
            count={clubCount}
          />
          {/* Something has to share the shelf with them. Only the plant, and
              only as a drawing: this row scrolls sideways, so it clips what
              rises above it, and a caption here would be cut in half. The
              plant asks for the forests on /books and on the way in. */}
          <ShelfPlant />
        </div>
        <Plank />
      </section>

      <YearlyGoalCard
        goal={userRecord?.yearlyGoal ?? null}
        readThisYear={readThisYear}
        year={year}
      />

      <section>
        {/* Three labelled buttons want 426px; a phone gives them 343. Let
            both rows wrap rather than run off the side of the screen. */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h2 className="text-lg font-semibold">
            {dict.dashboard.currentlyReading}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/books/search"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Search className="mr-2 h-4 w-4" />
              {dict.dashboard.findBooks}
            </Link>
            <Link
              href="/books"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Library className="mr-2 h-4 w-4" />
              {dict.dashboard.allMyBooks}
            </Link>
            <Link
              href="/clubs"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Users className="mr-2 h-4 w-4" />
              {dict.dashboard.clubs}
            </Link>
          </div>
        </div>

        {currentlyReading.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                {dict.dashboard.notReadingYet}
              </p>
              <Link
                href="/books/search"
                className={cn(buttonVariants({ className: "mt-4" }))}
              >
                {dict.dashboard.findYourNextBook}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentlyReading.map((ub) => (
              <BookCard
                key={ub.id}
                userBookId={ub.id}
                title={ub.book.title}
                author={ub.book.author}
                coverUrl={ub.book.coverUrl}
                shelf={ub.shelf as ShelfValue}
                finishedAt={ub.finishedAt}
                pagesRead={ub.pagesRead}
                totalPages={ub.totalPages}
                rating={ub.rating}
                review={ub.review}
                notes={ub.notes}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * One count, standing on the shelf. The whole tile is the link — a number
 * this size is a better target than the "details" caption it used to carry,
 * and the row stays quiet without six arrows in it.
 */
function CountTile({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="bg-card focus-visible:ring-ring/50 flex min-w-[7rem] flex-1 shrink-0 flex-col gap-1 rounded-t-xl rounded-b-[3px] px-4 py-3 shadow-[0_2px_12px_-6px_var(--shelf-contact)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:outline-none"
    >
      <span className="text-muted-foreground truncate text-xs">{label}</span>
      <span className="font-heading text-3xl leading-none">{count}</span>
    </Link>
  );
}
