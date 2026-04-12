import { defineConfig } from "vite";

// Vite config — pure-client static build (POC_P1 §12).
// base "./" = relativní cesty v indexu, aby build fungoval i z podadresáře (GH Pages apod.).
export default defineConfig({
  base: "./",
  server: {
    port: 5173,
    open: true, // automaticky otevři prohlížeč při `pnpm dev`
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
});
