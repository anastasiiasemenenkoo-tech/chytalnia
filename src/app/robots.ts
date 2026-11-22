import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/app-url";

/**
 * What a crawler may read.
 *
 * `/y/<token>` is the one page here anybody can open without signing in, and
 * it is a reader's own year: the books, the months, the counts. "Anyone with
 * the link" is what they agreed to — a search result is not. Indexing it
 * would hand out a link they only gave to friends, and revoking it afterwards
 * would not take the cached copy back. Everything behind the session is
 * listed too: a crawler only ever gets the login page from those, and asking
 * for them wastes its visit and ours.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/y/",
        "/api/",
        "/dashboard",
        "/books",
        "/clubs",
        "/duels",
        "/readers",
        "/settings",
        "/year",
        "/confirm-email",
        "/reset-password",
      ],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
