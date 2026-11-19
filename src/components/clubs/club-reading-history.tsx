import { Spine } from "@/components/decor/spine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary, getLocale } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";
import { prisma } from "@/lib/db";

export async function ClubReadingHistory({ clubId }: { clubId: string }) {
  const dict = await getDictionary();
  const locale = await getLocale();

  const history = await prisma.clubReadingHistory.findMany({
    where: { clubId, endedAt: { not: null } },
    include: { book: { select: { title: true, author: true } } },
    orderBy: { createdAt: "desc" },
  });

  function fmt(date: Date) {
    return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.clubs.historyTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {dict.clubs.historyEmpty}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-stretch gap-3">
                {/* A finished book is back on the shelf, spine out. */}
                <Spine
                  title={h.book.title}
                  label={`${h.book.title} — ${h.book.author}`}
                  silent
                  className="w-7 rounded-t-[3px]"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.book.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {h.book.author}
                  </p>
                  {h.endedAt && (
                    <p className="text-muted-foreground text-xs">
                      {interpolate(dict.clubs.historyDateRange, {
                        start: fmt(h.startDate ?? h.createdAt),
                        end: fmt(h.endedAt),
                      })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
