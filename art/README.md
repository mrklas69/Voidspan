# art/ — ⊙ Voidspan

Zdrojové grafické assety ⊙ Voidspanu. **40×40 native**, pixel art pro actors / bays / sprites / UI.

**Závazný vzorník (S35):** `apps/client/public/palette-preview.html` (dev: `http://localhost:5173/palette-preview.html`). Paleta **Voidspan Neon** — 5 rating tónů (výbojky) + per-kind hue pro moduly + amber chrome pro UI. Původní `style-guide.html` (Hull & Amber) = archiv.

**Moduly (S35+):** ShipRender procedurální (`ui/ship_render.ts`) + Tabler SVG ikony (MIT) v `public/assets/icons/`. PNG zdroje v `art/modules/` jsou archiv pro případ návratu k raster pipeline.

## Struktura

```
art/
├── modules/     # 8 modulů FVP: assembler, command_post, dock, engine,
│                #               habitat, medcore, solar_array, storage
├── actors/      # aktéři (Constructor, Hauler retirován, Player)
├── bays/        # stavy/overlay pro bay (floor, damaged, highlight…)
└── sprites/     # asteroid, ostatní world sprites
```

Kategorie zrcadlí `apps/client/public/assets/` (shipped). `MODULE_DEFS.asset` pole retirováno v S36 (procedural render); moduly se v runtime neregistrují jako PNG, pouze Tabler SVG glyphy.

## Konvence

- **Rozlišení:** 40×40 px native (tablet primary, baseline 1280×720).
- **Formát:** PNG, 32-bit RGBA.
- **Chroma key:** **magenta `#ff00ff`** v source PNG je vždy průhledná. Pipeline ji převede na `alpha=0`. Magenta se NIKDY nesmí objevit v samotném obsahu.
- **Naming:** `<kind>.png` v lowercase snake_case. Moduly už nepoužívají PNG (S35+, ShipRender procedural).
- **Templates / scratch:** soubory se **prefixem `_`** (např. `_template.png`) build skript ignoruje.

## Pipeline: source → ship

```bash
pnpm build:assets
```

Script (`scripts/build-assets.ps1`) projde celé `art/`, aplikuje chroma key (magenta → alpha), zrcadlí strukturu do `apps/client/public/assets/`, a vyčistí orphany (soubory v `public/assets/`, ke kterým už neexistuje zdroj).

Po buildu: **Ctrl+Shift+R** v prohlížeči (kvůli PNG cache).

## Palette compliance — `pnpm recolor:art`

Každý source PNG musí používat pouze barvy z **Voidspan Neon** (viz `palette-preview.html`). Pokud asset vznikl v editoru bez palette swatcheru (nebo předchází definici palety), snapni ho na nejbližší paletu:

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
