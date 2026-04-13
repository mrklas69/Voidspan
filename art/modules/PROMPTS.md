// Art Prompts — Voidspan moduly mateřské lodi (1×1 sprite sheet)

## Koncept

12 modulů 1×1 v jedné generaci. Chroma-key grid (magenta `#FF00FF` pozadí + dividers) pro snadné nakrájení do `art/modules/<name>.png`. Engine 2×2 a Dock 2×2 — separátně (jiný prompt, jiný cell-size).

## Styl

Top-down orthographic pixel-art, retro CRT terminal estetika ⊙ Voidspan. Tmavé hull pozadí (steel/gunmetal), warm amber/orange highlights, sporadické accent barvy (zelená pro biologii, modrá pro elektroniku, červená pro alert). Žádná anti-aliasing, žádný blur, ostré pixely, ploché barvy s jednou dither vrstvou.

**Paleta (přísně dodržet):**
- hull: `#1a1e28`, `#2e3440`, `#4c5462`
- kov: `#6a7080`, `#8a8e98`, `#c0c4cc`
- amber: `#ffd060`, `#ffc030`, `#b08030`, `#ff8020`
- accent: `#60c060` (bio), `#4088c8` (info), `#ff4848` (alert)
- bílá highlights: `#ffffff`

**Magenta `#FF00FF` se NIKDY nesmí objevit v obsahu modulu — výhradně pozadí + dividers.**

## 4×3 Chroma-Key Grid

```
Pixel-art top-down sprite sheet: 4 columns × 3 rows of separate space-station modules, arranged in a strict 4×3 matrix. Each module is square (1×1 tile, viewed from directly above).

BACKGROUND AND DIVIDERS: fill ALL space between and around cells with solid bright magenta (#FF00FF). Thick magenta dividers (at least 16 px equivalent) between every cell. Outer border also solid magenta. DO NOT use magenta, pink, fuchsia, or any purple-pink hue inside any module cell — these colors are RESERVED for the background/dividers only (they will be chroma-keyed to transparency).

Style for ALL 12 cells: blocky pixel-art retro CRT terminal aesthetic. Each module reads instantly as its function — strong silhouette, minimal detail. Industrial dark steel frame around each cell content (hull palette: #1a1e28, #2e3440, #4c5462), with warm amber accents (#ffd060, #ffc030, #b08030) for lights/equipment, sparse green (#60c060) for biology, blue (#4088c8) for screens, red (#ff4848) for alert/medical. Bright white (#ffffff) only as highlights on lights or glass. Module is centered in the cell, fills ~80% of the cell area, cell corners may show structural floor detail.

CRITICAL RESOLUTION CONSTRAINT (V1 — chunky / low-res): each cell represents a 16×16 native pixel-art sprite, rendered at 4× zoom for clarity. This means EVERY visible feature must occupy at least 4×4 pixels in the rendered image. NO sub-pixel detail. NO fine outlines. NO small text-like markings. Imagine the entire image is being designed for an 8-bit home computer with very limited resolution. Chunky, blocky, primitive.

VIEWPOINT CONSTRAINT (V2 — strict 2D top-down): STRICTLY 2D TOP-DOWN ORTHOGRAPHIC FLOOR PLAN. Looking straight down from above at 90 degrees. Absolutely NO perspective, NO depth, NO isometric tilt, NO 3D shading, NO diagonal walls, NO foreshortening, NO vanishing points. Every wall is a straight horizontal or vertical line. Every roof is a flat 2D shape. Imagine an architectural blueprint or a roguelike game tile (think Dwarf Fortress, Cogmind, RimWorld viewed from above). Shadows, if any, are flat darker patches with hard pixel edges — never gradients.

PALETTE CONSTRAINT (V3 — 8-bit total budget): maximum 12 distinct colors in the ENTIRE image (not per cell — total across all 12 cells combined). Inspired by 8-bit home computers (ZX Spectrum, Commodore 64, Atari 2600). NO gradients, NO antialiasing, NO color variations of the same hue. Each color used must be a flat solid block. Reuse the same dark steel grey across all module frames — do not invent new greys per cell.

ABSOLUTELY NO TEXT, NO LABELS, NO LETTERS, NO NUMBERS, NO LOGOS in any cell.

Cell layout (left to right, top to bottom):

ROW 1:
1. HABITAT — small geodesic dome with 2-3 lit window slits (amber glow), airlock door on one side, life-support pipes around base.
2. STORAGE — flat-roof container module with hatched cargo bay door on top, stacked crate silhouettes visible through transparent panel, sturdy industrial look.
3. MEDCORE — clinical white-grey module with red cross emblem on roof (use #ff4848), one rounded blue (#4088c8) screen panel, sterile clean shapes.

ROW 2:
4. ASSEMBLER — industrial workshop with mechanical robotic arm bolted to roof, conveyor belt slot visible, sparks/glow effect (amber), heavy machinery silhouette.
5. COMMANDPOST — central command hub with telescope antenna pointing up, multiple small screen panels (blue/amber glow), satellite dish detail. Tallest visual silhouette.
6. GREENHOUSE — transparent glass roof showing rows of green plants (#60c060) inside, frame in dark steel, irrigation pipes around perimeter, faint amber grow-lights.

ROW 3:
7. TANK — cylindrical fluid reservoir viewed from top (circular shape), pressure gauges around the rim (small amber dots), valves protruding, industrial tank look.
8. WORKSHOP — heavy-duty repair bay with workbench, scattered tools silhouettes, grindstone, oil drums, gritty industrial.
9. COMMARRAY — large parabolic dish antenna pointing up, mounted on a small base, signal pulse glow (amber), supporting struts visible.

ROW 4 (would overflow 4×3 — REMOVE if grid is exactly 4×3, OR extend to 4×4):
(intentionally only 9 above for 3 rows × 3 cols would be 9 — but we want 12, so use ALL 12 above filled into 4 columns × 3 rows)

CORRECTED ROW LAYOUT for 4×3 = 12 cells:
Row 1 (col 1-4): Habitat, Storage, MedCore, Assembler
Row 2 (col 1-4): CommandPost, Greenhouse, Tank, Workshop
Row 3 (col 1-4): CommArray, LAB (chemistry beakers + centrifuge silhouette, blue/amber glow), BATTERY (large battery cell with charge indicator bars in amber), REFINERY (smelter chimney with orange fire glow inside, ore conveyor)

Generate the image at high resolution (at least 1024×768 equivalent) so that each cell can be cropped and downscaled cleanly. Despite the high render resolution, the VISIBLE PIXEL DETAIL must remain at the chunky 16×16-equivalent level described in the V1 constraint above.

ITERATION HINT: nano-banana-2 has high seed-to-seed variance. Generate twice and pick the run that better honors V1 (chunkiness), V2 (strict top-down, no isometric), and V3 (limited palette). The second run often respects constraints better than the first.
```

## Pipeline

```bash
# 1. Vygenerovat v nano-banana-2 (1× prompt výše)
# 2. Otevřít v Aseprite / GIMP, rozříznout podle magenta dividers
# 3. Každý cell:
#    - Indexed mode → palette.png (project-wide paleta)
#    - Resize na 40×40 nearest-neighbor
#    - Magenta zůstává jako chroma key (build pipeline ji převede na alpha=0)
# 4. Uložit jako art/modules/<name>.png:
#    cell_1 → habitat.png
#    cell_2 → storage.png
#    cell_3 → medcore.png
#    cell_4 → assembler.png
#    cell_5 → command_post.png
#    cell_6 → greenhouse.png
#    cell_7 → tank.png
#    cell_8 → workshop.png
#    cell_9 → comm_array.png
#    cell_10 → lab.png
#    cell_11 → battery.png
#    cell_12 → refinery.png
# 5. Build pipeline:
#    pnpm build:assets
#    (skript scripts/key-transparency.ps1 převede #ff00ff → alpha 0)
# 6. Reaktivovat preload v GameScene.preload() — přidat kindy do AVAILABLE_MODULE_ASSETS
```

## Mapping cell → MODULE_DEFS asset

| Cell | Soubor              | MODULE_DEFS kind      | Status        |
|------|---------------------|-----------------------|---------------|
| 1    | habitat.png         | Habitat               | mateřská loď  |
| 2    | storage.png         | Storage               | mateřská loď  |
| 3    | medcore.png         | MedCore               | mateřská loď  |
| 4    | assembler.png       | Assembler             | mateřská loď  |
| 5    | command_post.png    | CommandPost           | mateřská loď  |
| 6    | greenhouse.png      | Greenhouse (TBD def)  | TODO MODULE_DEFS |
| 7    | tank.png            | Tank (TBD def)        | TODO MODULE_DEFS |
| 8    | workshop.png        | Workshop (TBD def)    | TODO MODULE_DEFS |
| 9    | comm_array.png      | CommArray (TBD def)   | TODO MODULE_DEFS |
| 10   | lab.png             | Lab (TBD def)         | TODO MODULE_DEFS |
| 11   | battery.png         | Battery (TBD def)     | TODO MODULE_DEFS |
| 12   | refinery.png        | Refinery (TBD def)    | TODO MODULE_DEFS |

## Engine + Dock 2×2 (samostatný sheet)

Modul 2×2 = 4 tiles native (každý 16×16 → modul 32×32). V segmentu (POC §3) Engine i Dock zabírají idx 6,7,14,15 — pravý kraj lodi. **Engine nozzle musí směřovat doprava** (ven z trupu, do prázdna), Dock airlock taky na pravé straně. Same scale, same orientation = po demontáži Engine vznikne Dock přesně na tom samém místě.

### 1×2 Chroma-Key Sheet (Engine vlevo, Dock vpravo)

```
Pixel-art top-down sprite sheet: 1 row × 2 columns of separate 2×2 space-station modules. Each cell is square (32×32 native pixel-art rendered at 4× zoom = 128×128 pixels).

BACKGROUND AND DIVIDERS: solid bright magenta (#FF00FF) around the entire sheet edge AND a thick magenta divider (≥16 px equivalent) between the two cells. DO NOT use magenta, pink, fuchsia, or any purple-pink hue inside any module — RESERVED for chroma key.

Style for BOTH cells: same as the 12-module sheet — blocky 8-bit pixel-art, retro CRT terminal aesthetic. ALL constraints from V1, V2, V3 apply identically:
  V1 — chunky, ~32×32 native resolution per cell, every visible feature ≥4×4 pixels rendered.
  V2 — STRICTLY 2D TOP-DOWN orthographic floor plan. NO perspective, NO isometric tilt, NO 3D shading, NO domes drawn as 3D hemispheres. Looking straight down from above at 90 degrees.
  V3 — same 12-color palette as the 12-module sheet (hull greys #1a1e28 / #2e3440 / #4c5462 / #6a7080, amber #ffd060 / #ffc030 / #b08030 / #ff8020, accents #60c060 / #4088c8 / #ff4848, white #ffffff). NO new colors.

ABSOLUTELY NO TEXT, NO LABELS, NO LETTERS, NO NUMBERS, NO LOGOS.

Cell layout (left to right):

CELL 1 — ENGINE (broken, dormant, to be demolished):
A rectangular industrial machine occupying the full 2×2 cell area, viewed from directly above. The ROCKET NOZZLE / EXHAUST BELL points to the RIGHT EDGE of the cell — it must clearly extend out toward the right side, like a cannon barrel sticking out. The nozzle is dark scorched metal (#2e3440) with a charred opening (#1a1e28) at the very right edge. The body of the engine fills the left 2/3 of the cell — bolted plates, cooling fins, heavy industrial pipes (warm amber #b08030 highlights for valves and rivets). One small dim red status light (#ff4848) indicating "offline / dormant". NO flame, NO exhaust glow, NO smoke — engine is OFF. Surrounding floor plates visible at cell corners.

CELL 2 — DOCK (active docking collar):
A circular docking ring centered in the 2×2 cell area, viewed from directly above. The central AIRLOCK opening is a bright amber circle (#ffd060) on the RIGHT side of the cell — same orientation as the engine nozzle (replaces it after demolition). Four heavy grappler arms extend outward from the ring at NW/NE/SW/SE corners, ending in clamp shapes. Around the ring perimeter: 6-8 small blinking amber landing lights (#ffc030 dots). The ring frame is steel grey (#4c5462). Background floor plates at cell corners. NO docked ship visible — this is the empty dock ready to receive.

Generate at high resolution so each 2×2 module can be cropped, then split into the four 16×16 native tiles for the segment grid.

ITERATION HINT: nano-banana-2 has high seed-to-seed variance. The "right-pointing nozzle" constraint for the Engine is the most likely to fail on first try (model defaults to symmetric/centered designs). Generate twice, pick the run where the nozzle clearly extends to the right edge.
```

### Krájení Engine 2×2

Po vygenerování a chroma-key transparentci rozříznout Engine cell na **4 tiles 40×40** (po downscale z 32×32 native → 40×40 nearest-neighbor):

```
engine.png        → 80×80 final (= 40×40 × 2 tiles wide × 2 tall)
                    LOAD jako 1 image, SegmentPanel kreslí 4× sub-region
nebo nakrájet:
engine_tl.png  engine_tr.png   (idx 6, 7  — top row)
engine_bl.png  engine_br.png   (idx 14, 15 — bottom row)
```

P1 SegmentPanel teď kreslí každý tile samostatně přes `drawTileSprite(i, kind)` — Phaser dostane `Engine` texturu pro každý ze 4 tiles a kreslí ji 4× celou (= 4 identické kopie). To je špatně pro multi-tile sprite. Buď:
- **A)** Engine = 4 separátní 40×40 textures (`Engine_tl`, `Engine_tr`, …) a `module_ref.rootOffset` určí, který kvadrant se kreslí.
- **B)** Engine = 1 monolitická 80×80 texture, SegmentPanel kreslí celou jen na root tile, ostatní tiles skip render.

KISS: **B**. SegmentPanel checkne `rootOffset === {0,0}` → kresli celou texturu, jinak skip. Při finalizaci přejde do TODO.
