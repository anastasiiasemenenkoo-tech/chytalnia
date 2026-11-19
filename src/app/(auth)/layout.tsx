import Link from "next/link";
import { BookOpen } from "lucide-react";

import { BookshelfStrip } from "@/components/decor/bookshelf-strip";
import { getDictionary } from "@/i18n";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary();
  return (
    // The wall colour, not a wash of its own: the shelf below has to read as
    // furniture standing in the same room as the rest of the app.
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12">
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
      <div className="w-full max-w-md">{children}</div>
      {/* The card stands in front of a shelf, so the first screen of the app
          is already the room the app is about. Wider than the card, so it
          reads as furniture behind it rather than a base under it. */}
      <div className="mt-10 w-full max-w-lg">
        <BookshelfStrip />
      </div>
    </div>
  );
}
