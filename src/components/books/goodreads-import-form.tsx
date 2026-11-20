"use client";

import { useActionState, useState } from "react";

import { importGoodreadsCsv } from "@/actions/goodreads-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { interpolate } from "@/i18n/interpolate";
import { useDict } from "@/i18n/provider";

/**
 * Must match `serverActions.bodySizeLimit` in next.config.ts. Past that limit
 * the request is rejected before the action runs, and the reader would see a
 * crash with nothing to do about it — so the file is weighed here instead.
 */
const MAX_BYTES = 8 * 1024 * 1024;

export function GoodreadsImportForm() {
  const [state, action, pending] = useActionState(
    importGoodreadsCsv,
    undefined,
  );
  const [tooBig, setTooBig] = useState(false);
  const dict = useDict();

  return (
    <form action={action} className="space-y-4">
      <Input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          setTooBig(!!file && file.size > MAX_BYTES);
        }}
      />
      <Button type="submit" disabled={pending || tooBig}>
        {pending ? dict.books.importSubmitting : dict.books.importSubmit}
      </Button>
      {/* The import can run for the better part of a minute on a long
          library, and a button that only greys out looks like nothing is
          happening. */}
      {pending && (
        <p className="text-muted-foreground text-sm">{dict.books.importWait}</p>
      )}
      {tooBig && <p className="text-destructive text-sm">{dict.books.importTooBig}</p>}
      {state && !state.ok && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {interpolate(dict.books.importSuccess, {
            imported: state.imported,
            skipped: state.skipped,
          })}
        </p>
      )}
    </form>
  );
}
