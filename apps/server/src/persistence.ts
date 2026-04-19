// Persistence — flat JSON dump world.json (Q1 rozhodnutí: KISS pro v1.1 POC).
//
// Formát souboru:
//   { schemaVersion: number, tick: number, savedAt: ISOString, world: World }
//
// Atomic write: píšeme do `world.json.tmp` + rename. Rename je atomic
// operace na ext4/NTFS — crash během fsync neskončí s půlpsaným souborem.
//
// Při schema mismatch (Q5 rozhodnutí: D nuke & restart) vracíme null a
// server si vytvoří čerstvý world přes createInitialWorld().

import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import type { World } from "@voidspan/shared";
import { SCHEMA_VERSION } from "@voidspan/shared";

// Wrapper pro persistovaný snapshot. `savedAt` je pro debugging / logs.
type SavedWorld = {
  schemaVersion: number;
  tick: number;
  savedAt: string;
  world: World;
};

// Atomic save — temp file + rename. Zajistí, že crash mid-write nezanechá
// poškozený world.json (staré platné data buď stále na disku, nebo nahrazena).
export function saveWorld(w: World, path: string): void {
  // Vytvoř parent directory pokud chybí (první boot).
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const payload: SavedWorld = {
    schemaVersion: SCHEMA_VERSION,
    tick: w.tick,
    savedAt: new Date().toISOString(),
    world: w,
  };

  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(payload), "utf8");
  renameSync(tmp, path); // atomic swap
}

// Load + schema check. Vrátí null pokud:
//   - soubor neexistuje (první boot),
//   - schema verze se liší (breaking change → Q5 nuke & restart),
//   - JSON parse fail (corrupted).
//
// Server při null volá createInitialWorld().
export function loadWorldOrNull(path: string): World | null {
  if (!existsSync(path)) {
    console.log(`[persistence] ${path} neexistuje — startuji fresh world`);
    return null;
  }

  try {
    const raw = readFileSync(path, "utf8");
    const payload = JSON.parse(raw) as SavedWorld;

    if (payload.schemaVersion !== SCHEMA_VERSION) {
      console.warn(
        `[persistence] schema mismatch (soubor v${payload.schemaVersion}, kód v${SCHEMA_VERSION}) — nuke & restart`,
      );
      return null;
    }

    console.log(
      `[persistence] načten snapshot tick=${payload.tick}, savedAt=${payload.savedAt}`,
    );
    return payload.world;
  } catch (err) {
    console.error(`[persistence] load selhal: ${String(err)} — nuke & restart`);
    return null;
  }
}
