import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        statements: 80,
        branches: 75,
      },
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "store/**/*.ts", "hooks/**/*.ts", "lib/**/*.ts"],
      exclude: ["app/layout.tsx", "app/globals.css"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@torre-swipe/types": resolve(__dirname, "../../packages/types/src/index.ts"),
      "@torre-swipe/torre-client": resolve(
        __dirname,
        "../../packages/torre-client/src/index.ts",
      ),
    },
  },
});
