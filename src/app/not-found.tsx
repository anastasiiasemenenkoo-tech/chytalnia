import Link from "next/link";
import { BookOpen } from "lucide-react";

import { BookshelfStrip } from "@/components/decor/bookshelf-strip";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n";

/**
 * Without this file a mistyped address lands on Next's own 404 — a bare
 * English line on a white page, in an app that speaks Ukrainian. The shelf
 * is here on purpose: a wrong turn should still look like the same room.
 */
export default async function NotFound() {
  const dict = await getDictionary();
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <Link
        href="/"
        className="font-heading mb-8 flex items-center gap-2 text-lg font-semibold"
      >
        <BookOpen className="h-5 w-5" />
        {dict.brand}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">
        {dict.errors.notFoundTitle}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {dict.errors.notFoundBody}
      </p>
      <Link href="/" className={`${buttonVariants({ size: "lg" })} mt-6`}>
        {dict.errors.notFoundAction}
      </Link>

      <div className="mt-10 w-full max-w-2xl">
        <BookshelfStrip />
      </div>
    </div>
  );
}
