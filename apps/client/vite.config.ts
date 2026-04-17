import { defineConfig } from "vite";

// Build ID — unique identifier per Vite process start (dev i build). Slouží
// pro verifikaci, že browser načetl aktuální verzi (Top Bar identity tooltip).
// Regenerates jen při restartu Vite procesu, ne při HMR.
const BUILD_ID = Date.now().toString(36);

// Vite config — pure-client static build (FVP architektura, GH Pages deploy).
// base "./" = relativní cesty v indexu, aby build fungoval i z podadresáře (GH Pages apod.).
export default defineConfig({
  base: "./",
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    port: 5173,
    open: true, // automaticky otevři prohlížeč při `pnpm dev`
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
    // Phaser sám má ~1.4 MB min; default 500 kB warning je pro POC bez splittingu zbytečný šum.
    chunkSizeWarningLimit: 1500,
  },
});
