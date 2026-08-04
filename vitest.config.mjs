import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.mjs"],
    coverage: {
      enabled: true,
      provider: "istanbul",
      include: ["index.mjs", "src/**/*.mjs"],
      exclude: ["**/*.test.mjs"],
      reporter: ["text", "lcov"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
