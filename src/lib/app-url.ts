import "server-only";

/**
 * The absolute base for links that leave the app inside an email.
 *
 * A letter has no request to read the host from, so the URL has to come from
 * the environment. `APP_URL` is the explicit answer; on Vercel the platform
 * already knows the production domain, so an unset `APP_URL` there no longer
 * means a reset link pointing at somebody's localhost. The last fallback is
 * only ever right in development.
 */
export function appUrl() {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return "http://localhost:3000";
}
