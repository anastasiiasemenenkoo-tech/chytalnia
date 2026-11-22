/**
 * The page a signed-out visitor was trying to reach, as somewhere this app
 * will actually send them afterwards.
 *
 * A club's invite link is the ordinary way into this app, and the person
 * following one is usually signed out — so the address has to survive the
 * trip through `/login`. It arrives in a query parameter, which means it
 * arrives from whoever wrote the link: anything that could leave this origin
 * is dropped rather than corrected.
 *
 * `//evil.example` is the one worth naming — the browser reads it as a
 * protocol-relative URL and leaves the site, while a glance at the string
 * says it is a path. A backslash is the same trick for browsers that
 * normalise it to a slash.
 */
export function safePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//") || path.startsWith("/\\")) return null;
  if (path.includes("\\")) return null;
  // Nothing under /api is a page, and the auth routes would loop.
  if (path.startsWith("/api/")) return null;
  return path;
}
