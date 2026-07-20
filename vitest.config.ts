import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "core/src"),
      "@data": path.resolve(__dirname, "data"),
    },
  },
  test: {
    environment: "node",
    include: ["core/tests/**/*.test.ts"],
  },
});
