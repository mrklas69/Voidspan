Pixel-art top-down sprite sheet for a retro CRT sci-fi colony sim ("Voidspan"). APERTURES & VENTILATION kit — openings, vents, fans, portholes, shafts, and covers, all viewed from directly above as if looking down into the ship from outside.

OUTPUT FORMAT: PNG only. No JPEG (lossy compression destroys the chroma-key).

=== CONTENT ===

All sprites on #6A7080 metal-gray base plates (unless the aperture IS a bare opening showing void #0a0a10 below). Free-floating on magenta background with ≥16 px gutter between sprites, loose groups — NOT rigid grid.

Group 1 — SIMPLE OPENINGS (cut-through, showing void below):
- small round porthole (32×32, black center #0a0a10, metal rim, rivets around)
- large round porthole with inner glass glint (48×48, amber glow #ffd060 or cyan #40c0c0 reflection dot)
- rectangular skylight (48×32, glass surface with subtle cross-dither)
- hexagonal viewport (40×40)
- oval service hatch opening (uncovered)
- square ventilation shaft opening — deep shadow inside, faint blades visible at bottom
- triangular drainage slit
- long narrow horizontal slit window (light amber glow from inside)
- long narrow vertical slit window (cyan info-screen glow from inside)

Group 2 — COVERED / GRILLED VENTS (flush with plating):
- round vent grille with parallel slats (3 sizes: 16, 24, 32 px diameter)
- square vent grille with crosshatch pattern
- hex vent grille (honeycomb interior)
- angled louvered vent (parallel diagonal slats)
- slotted floor grate (rectangular, parallel slits)
- star-pattern drain grate (radial slits)
- micro-perforated plate (dense dot pattern)
- waffle grate (crosshatch with raised squares)

Group 3 — FANS & ROTARY VENTILATORS (visible blades, top-down):
- 3-blade circular fan in housing (24×24)
- 4-blade circular fan (32×32)
- 5-blade high-speed fan (40×40) with motion-blur hint (a few faintly offset pixel ghosts)
- 6-blade heavy industrial fan (48×48) with mounting bolts at four corners
- dual fan housing (two fans side by side in one rectangular enclosure)
- turbine exhaust (round with radial exit pattern, glowing #ff8020 center)
- extractor fan with exterior cage (visible wire cage pattern)

Group 4 — SHAFTS & WELLS (deeper views looking down into depth):
- elevator shaft top (square frame, dark recess with faint cable hint)
- ladder shaft top (square frame, rungs visible descending into darkness)
- maintenance crawlspace top (rectangular hatch with handle)
- drop shaft / chute (round, dark gradient-dither falling into void)
- fuel well (circle with dark center, amber fluid hint near top #b08030)
- coolant well (circle with dark center, cyan fluid hint #40c0c0)

Group 5 — COVERS & CAPS (closed versions, flush or raised):
- flush round hatch cover (same diameter as porthole variants, no opening visible, just seam + central bolt + rivets)
- raised round hatch cover (lift-ring center, slight raised profile with shadow)
- square access panel (4 corner screws, faint seam)
- hexagonal inspection cover (center bolt, radial seams)
- sliding vent cover (half-open variant — shutter slats partially visible)
- emergency seal cap (warning amber stripes around rim, locked-down look)

=== STYLE RULES ===

STRICT 2D TOP-DOWN ORTHOGRAPHIC. Looking straight down at 90°. All circles are perfect circles from above. No perspective, no isometric tilt, no 3D shading. Shafts show depth via gradient-dither going darker toward center (hard-pixel dither bands, never smooth).

CHUNKY PIXEL ART. Each sprite is 16, 24, 32, 40, or 48 native pixels square (rendered at 4× zoom). Every feature at least 2×2 px. Blocky, 8-bit era. NO antialiasing, NO blur, NO gradients except where a hard-pixel dither band is specified for depth.

DIRECTIONAL LIGHTING: bright star FAR LEFT of frame. Every raised element (hatch covers, rims, vent housings, fan housings) gets:
- BRIGHT HIGHLIGHT pixels on its LEFT edge (use #c0c4cc or #ffffff, 1 px row)
- HARD-PIXEL SHADOW on its RIGHT edge (use #2e3440 or #1a1e28, flat dark patch, length ≈ element height)
Flat openings (portholes, slit windows, drain grates at plate level) cast NO shadow. Shafts cast inner shadow on their EAST inner wall (left inner wall is lit).

Consistent light direction across ALL sprites in the sheet.

ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO LOGOS, NO WARNING SYMBOLS with readable characters (generic stripes and arrows OK).

=== CRITICAL BACKGROUND RULE (V4) ===

The background of the ENTIRE sheet MUST be pure, saturated bright magenta, RGB exactly (255, 0, 255), hex #FF00FF. This is a chroma-key that will be auto-converted to transparency. If you use red, pink, fuchsia, coral, crimson, hot pink, or any near-magenta shade like (255, 0, 213) or (252, 52, 164) — the output is unusable and the task fails. No gradient. No antialiasing halo around sprites. No dithered background. Solid uniform pure magenta fill only. Verify before export.

=== PALETTE (16 colors STRICT) ===

Base: #6A7080 (plate)
Darks: #0a0a10 (void / deep shaft), #1a1e28, #2e3440, #4c5462
Lights: #8a8e98, #c0c4cc, #ffffff (specular only)
Status accents: #ff4848 (emergency), #ff8020 (exhaust glow), #ffc030, #60c060 (bio vent), #4088c8 (info screen), #40c0c0 (coolant / cold glow)
Amber: #b08030, #ffd060 (warm glow)

Chroma-key: #FF00FF — background ONLY. Never inside any sprite.
