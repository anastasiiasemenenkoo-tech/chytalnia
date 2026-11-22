import Link from "next/link";
import { Eye } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Who can see the thing the reader is looking at — said where they are
 * looking at it, not buried in a policy.
 *
 * Nothing in this app's clubs is private: anyone signed in can join any club
 * and read what was written in it, and a reader's shelves and reviews are
 * open to every signed-in reader. That is a deliberate design, and it is
 * also not what people assume about a room with a members list. Assuming
 * wrongly is the harm, so the places where someone decides to write
 * something say it out loud.
 *
 * Deliberately quiet: a warning box at every turn teaches people to stop
 * reading them. One muted line with an eye, in the same breath as the
 * control it describes.
 */
export function VisibilityNote({
  children,
  href,
  linkLabel,
  className,
}: {
  children: React.ReactNode;
  /** Where "more about this" goes, when there is more to say. */
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <p
      data-testid="visibility-note"
      className={cn(
        "text-muted-foreground flex items-start gap-2 text-xs leading-relaxed",
        className,
      )}
    >
      <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {children}
        {href && linkLabel ? (
          <>
            {" "}
            <Link href={href} className="underline">
              {linkLabel}
            </Link>
          </>
        ) : null}
      </span>
    </p>
  );
}
