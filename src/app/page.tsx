import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Library, Search, Users } from "lucide-react";

import { BookshelfStrip } from "@/components/decor/bookshelf-strip";
import { Plank } from "@/components/decor/plank";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";
import { getDictionary } from "@/i18n";
import { cn } from "@/lib/utils";

export default async function Home() {
  const [session, dict] = await Promise.all([auth(), getDictionary()]);
  if (session?.user) redirect("/dashboard");

  const features = [
    {
      icon: Library,
      title: dict.landing.featureShelvesTitle,
      body: dict.landing.featureShelvesBody,
      href: "/books",
    },
    {
      icon: Search,
      title: dict.landing.featureSearchTitle,
      body: dict.landing.featureSearchBody,
      href: "/books/search",
    },
    {
      icon: Users,
      title: dict.landing.featureClubsTitle,
      body: dict.landing.featureClubsBody,
      href: "/clubs",
    },
  ];

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-heading flex items-baseline gap-2 text-lg font-semibold"
        >
          <BookOpen className="h-5 w-5 self-center" />
          {dict.brand}
          <span className="text-muted-foreground hidden text-xs font-normal italic sm:inline">
            · {dict.tagline}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            {dict.landing.signIn}
          </Link>
          <Link href="/signup" className={cn(buttonVariants())}>
            {dict.landing.getStarted}
          </Link>
        </div>
      </header>
      {/* The same rail the app's own top bar sits on, so the door and the
          room behind it are made of the same wood. */}
      <Plank size="rail" />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {dict.landing.headline}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-lg">
          {dict.landing.blurb}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
            {dict.landing.cta}
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            {dict.landing.ctaSecondary}
          </Link>
        </div>

        {/* The app is about a shelf of books, so the landing page shows one
            rather than describing it. */}
        <div className="mt-16 w-full max-w-2xl">
          <BookshelfStrip />
        </div>

        <div className="mt-16 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              // These all sit behind auth; prefetching them from the public
              // landing page just triggers a server-side "Not authenticated".
              prefetch={false}
              className="bg-card text-card-foreground focus-visible:ring-ring/50 block rounded-xl p-6 text-left shadow-[0_2px_12px_-6px_var(--shelf-contact)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_-8px_var(--shelf-contact)] focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <f.icon className="text-muted-foreground mb-3 h-5 w-5" />
              <h2 className="font-heading text-sm font-medium">{f.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{f.body}</p>
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-xs">
        {dict.landing.builtOn}
      </footer>
    </div>
  );
}
