import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        statements: 98,
        branches: 95,
        functions: 98,
        lines: 98,
      },
      include: ["app/**/*.ts", "lib/**/*.ts"],
      exclude: ["app/layout.tsx"],
    },
  },
  resolve: {
    alias: {
      "@torre-swipe/types": resolve(__dirname, "../../packages/types/src/index.ts"),
      "@torre-swipe/torre-client": resolve(
        __dirname,
        "../../packages/torre-client/src/index.ts",
      ),
    },
  },
});
