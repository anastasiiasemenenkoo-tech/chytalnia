import type { MetadataRoute } from "next";

/**
 * What turns this from a page into something that sits on a home screen.
 *
 * Deliberately static and deliberately Ukrainian: the manifest is fetched
 * by the browser on its own, often without the reader's cookies, so reading
 * the locale here would only make the file dynamic and still guess wrong.
 * Ukrainian is this app's default.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Читальня",
    short_name: "Читальня",
    description: "Твій читацький простір: полиці, клуби, підсумок року.",
    lang: "uk",
    // Not "/": somebody who put this on their home screen wants their
    // shelves, not the page that explains what the app is.
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e6eafa",
    theme_color: "#e6eafa",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
