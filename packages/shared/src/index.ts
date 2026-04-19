// Barrel re-export pro @voidspan/shared.
// Konzumenti (apps/client, budoucí apps/server) importují přes `import { ... } from "@voidspan/shared"`.
// Uvnitř balíčku zůstávají relativní cesty (world/* → ../model atd.).

export * from "./model";
export * from "./events";
export * from "./tuning";
export * from "./world";
export * from "./protocol";
