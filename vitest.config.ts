import { fileURLToPath } from "node:url";

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Unit tests only, and on purpose: these cover the parts that can be
 * reasoned about without a browser — the Goodreads row reader, the year's
 * arithmetic, the Wikidata ranking, the validation messages, the rate
 * limiter's windows — which is where every bug so far has actually lived.
 * Pages and server components are checked in the running app instead.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // See test/server-only.ts — the marker package has no Node entry
      // point, so anything importing it is otherwise unloadable here.
      "server-only": fileURLToPath(
        new URL("./test/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
