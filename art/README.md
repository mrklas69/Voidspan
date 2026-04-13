# art/

Zdrojové grafické assety Voidspanu. **40×40 native**, pixel art ve stylu Dune II (1992).

## Struktura

```
art/
├── modules/     # moduly (v P1: SolarArray, Engine, Dock; P2+: Habitat, Storage, ...)
├── actors/      # aktéři (Constructor, Hauler, Player)
├── tiles/       # stavy/overlay pro tile (floor, damaged, highlight…)
└── ui/          # HUD ikony, UI elementy
```

Kategorie zrcadlí `apps/client/public/assets/` (shipped).

## Konvence

- **Rozlišení:** 40×40 px native (POC_P1 §16, tablet primary).
- **Formát:** PNG, 32-bit RGBA.
- **Chroma key:** **magenta `#ff00ff`** v source PNG je vždy průhledná. Pipeline ji převede na `alpha=0`. Magenta se NIKDY nesmí objevit v samotném obsahu.
- **Naming:** `<kind>.png` v lowercase snake_case. Pro moduly musí odpovídat `MODULE_DEFS[kind].asset` v `apps/client/src/game/model.ts`.
- **Templates / scratch:** soubory se **prefixem `_`** (např. `_template.png`) build skript ignoruje.

## Pipeline: source → ship

```bash
pnpm build:assets
```

Script (`scripts/build-assets.ps1`) projde celé `art/`, aplikuje chroma key (magenta → alpha), zrcadlí strukturu do `apps/client/public/assets/`, a vyčistí orphany (soubory v `public/assets/`, ke kterým už neexistuje zdroj).

Po buildu: **Ctrl+Shift+R** v prohlížeči (kvůli PNG cache).

## Workflow s AI

Pokud generuješ přes AI (DALL-E, Midjourney, SD):

- **Canvas 512×512** (ne 40×40 — modely neumí cílit native rozlišení spolehlivě)
- **Subject edge-to-edge**, žádné padding
- **Background pure saturated `#ff00ff`** (magenta — projektová konvence). Alternativa `#ffff00` (yellow), ale drž jednu per projekt.
- Ulož do `art/<kat>/<name>.png`, pusť `pnpm build:assets` — downscale + chroma key + ship

## Reference a moodboard

Volné reference (palette swatches, img2img structure refs, moodboard) se sem nedávají k finálním assetům. Pokud potřeba, založ `reference/` samostatně — build skript tuto složku ignoruje.
