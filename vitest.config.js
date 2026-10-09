import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright specs in tests/e2e run with `npm run test:e2e`, not Vitest.
    include: ["tests/unit/**/*.test.js"],
  },
});
