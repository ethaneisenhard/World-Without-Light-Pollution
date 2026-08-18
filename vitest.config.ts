import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Scope to this project's tests. Vendored @glassbox-studio packages carry
    // their own (monorepo/Studio-dependent) suites — see vendor/*/**.test.ts.
    include: ["src/**/*.test.ts"],
  },
});
