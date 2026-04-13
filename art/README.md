# art/ — ⊙ Voidspan

Zdrojové grafické assety ⊙ Voidspanu. **40×40 native**, pixel art ve stylu Dune II (1992).

**Závazný vzorník:** `apps/client/public/style-guide.html` (dev: `http://localhost:5173/style-guide.html`). Paleta **Voidspan 16 — Hull & Amber**, font **VT323**, tile scale 2×.

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

## Palette compliance — `pnpm recolor:art`

Každý source PNG musí používat pouze barvy z **Voidspan 16** (viz style-guide §1). Pokud asset vznikl v editoru bez palette swatcheru (nebo předchází definici palety), snapni ho na nejbližší paletu:

```bash
pnpm recolor:art -- -SrcPath art/<kat>/<name>.png -DstPath art/<kat>/<name>.png
```

Script (`scripts/recolor-to-palette.ps1`) projde pixel po pixelu, najde nejbližší paletovou barvu (RGB Euklid) a vytiskne audit:
- `touched pixels` — kolik ne-transparentních pixelů se přerenderovalo
- `max distance before snap` — 0 = exact, 30+ = výrazný shift (asset byl významně mimo paletu)
- per-color histogram — které paletové barvy dominují

Po recoloru pusť `pnpm build:assets` pro ship.

## Workflow s AI

Pokud generuješ přes AI (DALL-E, Midjourney, SD):

- **Canvas 512×512** (ne 40×40 — modely neumí cílit native rozlišení spolehlivě)
- **Subject edge-to-edge**, žádné padding
- **Background pure saturated `#ff00ff`** (magenta — projektová konvence). Alternativa `#ffff00` (yellow), ale drž jednu per projekt.
- Ulož do `art/<kat>/<name>.png`, pusť `pnpm build:assets` — downscale + chroma key + ship

## Reference a moodboard

Volné reference (palette swatches, img2img structure refs, moodboard) se sem nedávají k finálním assetům. Pokud potřeba, založ `reference/` samostatně — build skript tuto složku ignoruje.
