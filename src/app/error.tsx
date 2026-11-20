"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { interpolate } from "@/i18n/interpolate";
import { useDict } from "@/i18n/provider";

/**
 * The boundary that catches anything thrown while rendering a page. Without
 * it a reader sees the framework's own crash screen, which is in English and
 * says nothing they can act on.
 *
 * `unstable_retry` is this version's prop — it re-fetches and re-renders the
 * segment, where the older `reset` only cleared the boundary. The name is
 * ugly and it is still the right one.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const dict = useDict();

  useEffect(() => {
    // The only place this is recorded. In production the message is already
    // stripped; the digest is what matches a line in the server log.
    console.error(error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {dict.errors.errorTitle}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {dict.errors.errorBody}
      </p>
      <Button size="lg" className="mt-6" onClick={() => unstable_retry()}>
        {dict.errors.errorAction}
      </Button>
      {error.digest ? (
        <p className="text-muted-foreground/70 mt-4 font-mono text-xs">
          {interpolate(dict.errors.errorDigest, { digest: error.digest })}
        </p>
      ) : null}
    </div>
  );
}
