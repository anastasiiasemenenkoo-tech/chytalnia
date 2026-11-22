import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/app-url";

/**
 * Only the pages a stranger can actually read. Everything else needs a
 * session, and a reader's shared year is deliberately not advertised.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/signup`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
