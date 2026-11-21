"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDict } from "@/i18n/provider";

const DISMISSED = "chytalnia:install-hint-dismissed";

/**
 * iOS never offers to install anything. Safari has no prompt a site can
 * raise — the reader has to find «На екран «Додому»» in the share menu
 * themselves — so the only way they will ever learn this app can live on
 * their home screen is if it says so.
 *
 * Shown once, to iPhones that are not already running it that way, and
 * never again after it is dismissed.
 */
export function InstallHint() {
  const dict = useDict();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Decided after mount on purpose: none of this exists on the server,
    // and guessing would mean rendering one thing and hydrating another.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari's own, older flag, still the one that is true on iOS.
      (navigator as { standalone?: boolean }).standalone === true;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {
      // Private window, or storage blocked. Showing the hint once more is a
      // smaller problem than crashing the dashboard.
    }
    setShow(isIOS && !standalone && !dismissed);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
  }

  if (!show) return null;

  return (
    <div className="bg-card text-card-foreground flex items-start gap-3 rounded-lg border p-3 text-sm">
      <Share className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="flex-1 leading-snug">{dict.install.hint}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-mt-1 -mr-1 h-7 w-7 shrink-0"
        onClick={dismiss}
        aria-label={dict.install.dismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
