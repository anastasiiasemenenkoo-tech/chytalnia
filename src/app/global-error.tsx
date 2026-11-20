"use client";

import "./globals.css";

/**
 * The last net: this one catches errors thrown by the root layout itself,
 * and because it replaces that layout it has to bring its own `<html>` and
 * `<body>`, its own stylesheet — and its own words, since the locale is read
 * in the layout that just failed.
 *
 * So the text here is Ukrainian and hard-coded. That is the honest trade: a
 * page that cannot reach the dictionary should still say something, and the
 * app's default locale is Ukrainian.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="uk" className="h-full antialiased">
      <body className="bg-background text-foreground min-h-full">
        <title>Читальня</title>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Читальня не відчинилася
          </h1>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm">
            Щось зламалося ще до того, як сторінка почала малюватися. Спробуй
            ще раз.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="bg-primary text-primary-foreground focus-visible:ring-ring mt-6 inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium focus-visible:ring-3 focus-visible:outline-none"
          >
            Спробувати ще раз
          </button>
          {error.digest ? (
            <p className="text-muted-foreground/70 mt-4 font-mono text-xs">
              Код помилки: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
