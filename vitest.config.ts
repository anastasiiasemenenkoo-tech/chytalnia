import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Unit tests only, and on purpose: these cover the pure parts of the
 * reading code — the Goodreads row reader, the year's arithmetic and the
 * Wikidata ranking — which is where every bug so far has actually lived.
 * Pages and server components are checked in the running app instead.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
