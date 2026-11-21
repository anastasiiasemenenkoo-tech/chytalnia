"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";
import { interpolate } from "@/i18n/interpolate";

/**
 * Hands the reader their year as a picture.
 *
 * On a phone this opens the system share sheet with the image attached,
 * which is how a story or a chat message actually gets made. Everywhere
 * else it saves the file, because a browser with no share sheet has
 * nothing useful to do with a blob.
 */
export function ShareYearButton({ year }: { year: number }) {
  const dict = useDict();
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    try {
      const res = await fetch("/year/card");
      if (!res.ok) throw new Error(`card: ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], `chytalnia-${year}.png`, {
        type: "image/png",
      });
      const text = interpolate(dict.year.shareText, { year });

      // Level 2 of the Web Share API — files. Safari on iOS has it; a
      // desktop browser usually does not, and `canShare` is the only
      // honest way to ask before trying.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(dict.year.shareSaved);
    } catch (error) {
      // A share the reader cancelled is not a failure, and the browser
      // reports it the same way as a real one.
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
      toast.error(dict.year.shareFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={share} disabled={busy} variant="outline">
      <Share2 className="mr-2 h-4 w-4" />
      {busy ? dict.year.sharePreparing : dict.year.share}
    </Button>
  );
}
