import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.ts";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Not declared in the manifest's content_scripts (that would
        // auto-inject it on every matching page — see manifest.config.ts).
        // It's only ever injected on-demand via chrome.scripting.executeScript
        // from the popup, which needs a stable, predictable output path —
        // hence the unhashed entryFileNames below just for this entry.
        content: resolve(import.meta.dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "content" ? "assets/content.js" : "assets/[name]-[hash].js",
      },
    },
  },
});
