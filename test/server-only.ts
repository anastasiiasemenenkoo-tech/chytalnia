/**
 * `server-only` is a marker package: importing it in a client bundle is
 * meant to fail the build. It has no Node entry point, so a module that
 * imports it cannot be loaded by Vitest at all — and some of the code worth
 * testing (the rate limiter, for one) is server-only by definition.
 *
 * Aliased to this empty module in `vitest.config.ts`. Nothing is lost: the
 * guarantee it provides is a build-time one, and `next build` still checks
 * it.
 */
export {};
