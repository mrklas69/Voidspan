# AI Art Prompts — ⊙ Voidspan

Skladiště promptů pro generátory pixel-art sprite sheetů (Gemini, Flux, Ernie, Grok, nano-banana-2, Retro Diffusion, PixelLab, Midjourney…).

Každý `XX-*.md` soubor obsahuje **jen prompt** (čistý text ke zkopírování). Všechen metadata / návody / historie žijí v tomhle README.

## Workflow

1. Vyber prompt z níže uvedeného katalogu.
2. Zkopíruj celý obsah `XX-*.md` do generátoru, vygeneruj sheet.
3. Ulož do `temp/` jako `<source>_raw.png` (nebo podobně).
4. Zpracuj: `powershell -File scripts/process-art.ps1 -SrcPath temp/<raw>.png -DstPath temp/<kit>_clean.png`
   - Default chroma-key = magenta `#FF00FF`, tolerance ±40.
   - Pokud AI ignoroval magenta, samploj skutečnou barvu z rohu (Paint.NET → pipetka) a použij `-KeyR -KeyG -KeyB -Tolerance`.
5. Nakrájej sprity v Paint.NET → přejmenuj → `apps/client/public/assets/modules/<name>.png`.
6. Přidej `kind` do `AVAILABLE_MODULE_ASSETS` v `GameScene.ts` a do `MODULE_DEFS` v `model.ts` pokud je to nový modul.

## Univerzální axiomy (platí pro všechny prompty)

- **Paleta:** Voidspan 16 (viz `art/_palette.txt`). Nikdy mimo paletu.
- **Styl:** strict 2D top-down orthographic, chunky 8-bit pixel art, žádný antialiasing / blur / gradient. Hard-pixel edges.
- **Světlo:** directional from left (star), hard-pixel shadow to right. Každý raised element má highlight pixel na levém okraji, stín napravo.
- **Chroma-key (V4):** background = pure `#FF00FF` (RGB 255,0,255). NIKDY pink/fuchsia/coral. AI často cheatuje — V4 pravidlo v každém promptu.
- **Output format:** PNG only. JPG rozmaže magenta okraje a rozbije chroma-key (lekce z grok kit-05 halo).
- **Zákaz:** text, písmena, čísla, loga, symboly.

## Katalog promptů

| Soubor | Obsah | Target size |
|---|---|---|
| [01-modules-grid.md](01-modules-grid.md) | 4×3 grid mateřských modulů + companion 1×2 pro Engine/Dock 2×2 | 1024×768 + 256×128 |
| [02-asset-kit-structural.md](02-asset-kit-structural.md) | Strukturální kit — platformy, nosníky, spoje, potrubí, antigrav, solární, antény, ramena | 512–1024 sq |
| [03-surface-joints-sampler.md](03-surface-joints-sampler.md) | Vzorník šumu / stínů / odlesků na `#6A7080` base + přechody a spoje | 1024×768 |
| [04-apertures-vents.md](04-apertures-vents.md) | Apertury, ventilátory, šachty, kryty, portholy | 1024×768 |

## Mapping: 01-modules-grid → MODULE_DEFS

Po generaci sheetu nakrájet 12 cells (4×3 grid) + 2 cells (Engine/Dock 2×2) a uložit jako:

| Cell | Soubor              | MODULE_DEFS kind | Status |
|------|---------------------|------------------|--------|
| 1    | habitat.png         | Habitat          | mateřská loď |
| 2    | storage.png         | Storage          | mateřská loď |
| 3    | medcore.png         | MedCore          | mateřská loď |
| 4    | assembler.png       | Assembler        | mateřská loď |
| 5    | command_post.png    | CommandPost      | mateřská loď |
| 6    | greenhouse.png      | Greenhouse       | TODO MODULE_DEFS |
| 7    | tank.png            | Tank             | TODO MODULE_DEFS |
| 8    | workshop.png        | Workshop         | TODO MODULE_DEFS |
| 9    | comm_array.png      | CommArray        | TODO MODULE_DEFS |
| 10   | lab.png             | Lab              | TODO MODULE_DEFS |
| 11   | battery.png         | Battery          | TODO MODULE_DEFS |
| 12   | refinery.png        | Refinery         | TODO MODULE_DEFS |
| E    | engine.png          | Engine (2×2)     | mateřská loď |
| D    | dock.png            | Dock (2×2)       | build target |

## Multi-bay moduly (Engine 2×2, Dock 2×2)

Engine sheet je 80×80 native PNG = 2 bays × 2 bays × 40 native. Po nasazení:
- `apps/client/public/assets/modules/engine.png` = monolit 80×80
- `AVAILABLE_MODULE_ASSETS` whitelistuje `Engine`
- `SegmentPanel.drawBaySprite` (S17b) umí render multi-bay: root bay (`rootOffset === {0,0}`) kreslí celou texturu přes span, ref bays skryjí sprite
- Engine nozzle musí mířit **doprava** (ven z trupu), Dock airlock stejná orientace — po demontáži Engine → build Dock drží místo beze změny orientace

## Zkušenosti s generátory (2026-04-14)

| Generátor | Dodržel magenta? | Formát | Výsledek |
|---|---|---|---|
| Gemini #1 (kit-01) | téměř (lehké rozmazání okraje) | PNG | ✓ dobré |
| Gemini #2 (kit-02) | ano | PNG | ✓ výborné |
| Flux (kit-04) | ano | JPEG | ✓ použitelné |
| Ernie (kit-03) | NE — pink `(255,0,213)` | PNG | ~ zachráněno s tenkými okraji |
| Grok imagine (kit-05) | NE — pink `(252,52,164)` | **JPEG** | ✗ silné halo, spíš regenerovat |
| Gemini #3 (kit-06, organika) | ano | PNG | ✓ mimo styl pro P1 |

**Lekce:**
- Vždycky žádat **PNG** explicitně. JPG zničí chroma-key antialiasingem.
- Grok/Ernie občas ignorují magenta — V4 pravidlo + ověření sample před `process:art`.
- Když AI vyrobí pink-magenta místo čisté magenta, samploj reálnou barvu a použij custom `-KeyR/G/B`.
- Pokud je max recolor distance >50, AI se hodně odchýlil od palety — regenerovat s striktnějším V3 constraintem.
