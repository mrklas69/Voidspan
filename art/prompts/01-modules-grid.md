Pixel-art top-down sprite sheet: 4 columns × 3 rows of separate space-station modules, arranged in a strict 4×3 matrix. Each module is square (1×1 tile, viewed from directly above).

BACKGROUND AND DIVIDERS: fill ALL space between and around cells with solid bright magenta (#FF00FF). Thick magenta dividers (at least 16 px equivalent) between every cell. Outer border also solid magenta. DO NOT use magenta, pink, fuchsia, or any purple-pink hue inside any module cell — these colors are RESERVED for the background/dividers only (they will be chroma-keyed to transparency).

Style for ALL 12 cells: blocky pixel-art retro CRT terminal aesthetic. Each module reads instantly as its function — strong silhouette, minimal detail. Industrial dark steel frame around each cell content (hull palette: #1a1e28, #2e3440, #4c5462), with warm amber accents (#ffd060, #ffc030, #b08030) for lights/equipment, sparse green (#60c060) for biology, blue (#4088c8) for screens, red (#ff4848) for alert/medical. Bright white (#ffffff) only as highlights on lights or glass. Module is centered in the cell, fills ~80% of the cell area, cell corners may show structural floor detail.

CRITICAL RESOLUTION CONSTRAINT (V1 — chunky / low-res): each cell represents a 16×16 native pixel-art sprite, rendered at 4× zoom for clarity. This means EVERY visible feature must occupy at least 4×4 pixels in the rendered image. NO sub-pixel detail. NO fine outlines. NO small text-like markings. Imagine the entire image is being designed for an 8-bit home computer with very limited resolution. Chunky, blocky, primitive.

VIEWPOINT CONSTRAINT (V2 — strict 2D top-down): STRICTLY 2D TOP-DOWN ORTHOGRAPHIC FLOOR PLAN. Looking straight down from above at 90 degrees. Absolutely NO perspective, NO depth, NO isometric tilt, NO 3D shading, NO diagonal walls, NO foreshortening, NO vanishing points. Every wall is a straight horizontal or vertical line. Every roof is a flat 2D shape. Imagine an architectural blueprint or a roguelike game tile (think Dwarf Fortress, Cogmind, RimWorld viewed from above). Shadows, if any, are flat darker patches with hard pixel edges — never gradients.

PALETTE CONSTRAINT (V3 — 8-bit total budget): maximum 12 distinct colors in the ENTIRE image (not per cell — total across all 12 cells combined). Inspired by 8-bit home computers (ZX Spectrum, Commodore 64, Atari 2600). NO gradients, NO antialiasing, NO color variations of the same hue. Each color used must be a flat solid block. Reuse the same dark steel grey across all module frames — do not invent new greys per cell.

ABSOLUTELY NO TEXT, NO LABELS, NO LETTERS, NO NUMBERS, NO LOGOS in any cell.

Cell layout (4 columns × 3 rows = 12 cells):

Row 1: Habitat, Storage, MedCore, Assembler
Row 2: CommandPost, Greenhouse, Tank, Workshop
Row 3: CommArray, Lab, Battery, Refinery

HABITAT — small geodesic dome with 2-3 lit window slits (amber glow), airlock door on one side, life-support pipes around base.
STORAGE — flat-roof container module with hatched cargo bay door on top, stacked crate silhouettes visible through transparent panel, sturdy industrial look.
MEDCORE — clinical white-grey module with red cross emblem on roof (use #ff4848), one rounded blue (#4088c8) screen panel, sterile clean shapes.
ASSEMBLER — industrial workshop with mechanical robotic arm bolted to roof, conveyor belt slot visible, sparks/glow effect (amber), heavy machinery silhouette.
COMMANDPOST — central command hub with telescope antenna pointing up, multiple small screen panels (blue/amber glow), satellite dish detail. Tallest visual silhouette.
GREENHOUSE — transparent glass roof showing rows of green plants (#60c060) inside, frame in dark steel, irrigation pipes around perimeter, faint amber grow-lights.
TANK — cylindrical fluid reservoir viewed from top (circular shape), pressure gauges around the rim (small amber dots), valves protruding, industrial tank look.
WORKSHOP — heavy-duty repair bay with workbench, scattered tools silhouettes, grindstone, oil drums, gritty industrial.
COMMARRAY — large parabolic dish antenna pointing up, mounted on a small base, signal pulse glow (amber), supporting struts visible.
LAB — chemistry beakers + centrifuge silhouette, blue/amber glow.
BATTERY — large battery cell with charge indicator bars in amber.
REFINERY — smelter chimney with orange fire glow inside, ore conveyor.

CRITICAL BACKGROUND RULE (V4): The background color of the entire sprite sheet MUST be pure, saturated bright magenta, RGB exactly (255, 0, 255), hex #FF00FF. This is a chroma-key that will be converted to transparency by an automated script. If you use red, pink, purple, fuchsia, coral, crimson, hot pink, or any near-magenta shade like (255, 0, 213) or (252, 52, 164) — the output is unusable. No gradient on the background. No antialiasing ring around sprites. Solid uniform pure magenta fill only. Verify before output.

OUTPUT FORMAT: PNG only. Do not output JPEG — lossy compression destroys the chroma-key.

Generate the image at high resolution (at least 1024×768 equivalent) so that each cell can be cropped and downscaled cleanly. Despite the high render resolution, the VISIBLE PIXEL DETAIL must remain at the chunky 16×16-equivalent level described in the V1 constraint.

---

Companion sheet (Engine + Dock 2×2):

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

CRITICAL BACKGROUND RULE (V4): Same as the 12-module sheet — pure #FF00FF RGB (255,0,255), no pink/fuchsia variants, PNG only, no JPEG.
