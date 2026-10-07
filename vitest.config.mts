import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) },
      // Next.js resolves this marker itself; outside Next it would throw on import.
      { find: "server-only", replacement: fileURLToPath(new URL("./test/server-only.ts", import.meta.url)) },
    ],
  },
  test: {
    // Component tests opt into jsdom with a `@vitest-environment jsdom` comment.
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    // The first run downloads a MongoDB binary for the in-memory test server.
    hookTimeout: 120_000,
  },
});
