import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: "web",
  // Relative asset paths (not the default "/") so the built index.html
  // also loads correctly over file:// — needed for /desktop's Electron
  // shell, which loads the built dist/index.html directly off disk rather
  // than from an HTTP server. Harmless for normal browser/static hosting.
  base: "./",
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "core/src"),
      "@data": path.resolve(__dirname, "data")
    }
  },
  server: {
    port: 5173
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});
