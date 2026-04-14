Pixel-art top-down asset kit for a retro CRT sci-fi colony sim ("Voidspan"). One large sprite sheet on solid magenta #FF00FF background (chroma-key — transparent after export). No grid dividers, no frames, no labels. Just FREE-FLOATING sprites scattered across the sheet with generous magenta spacing between them so each can be cut out cleanly.

=== CONTENT — a diverse kit of modular space-station parts, EACH rendered as a separate sprite ===

Structural:
- rectangular hull platforms (small 1×1, medium 1×2, large 2×2)
- long straight girders / trusses (horizontal and vertical)
- T-junction, L-junction, X-junction connectors
- diagonal support struts
- corner reinforcements with visible rivet patterns (clusters of 3–6 chunky rivets)
- bulkheads with thick plating seams

Surfaces & detail:
- bare hull floor plates (clean and weathered variants)
- catwalk grating
- cable runs / thick bundled wires (laid flat along floor)
- pipe segments (straight, elbow, T-junction) — two diameters
- rivet strips
- welded seams
- maintenance hatch covers (square and round)

Openings:
- airlock doors (closed, with pressure-ring)
- sliding bulkhead doors
- viewport windows (round and rectangular) with amber/cyan interior glow

Habitat & function modules (all 1×1 or 2×2 top-down):
- domed habitat pod (circular footprint, amber glow through narrow viewports — dome read as CIRCLE from above, NO perspective)
- cylindrical storage tank (circle footprint, amber pressure-gauge dots around rim)
- spherical pressure vessel (read as circle with concentric rim + rivet band)
- docking port (concentric rings + clamp arms extending outward)
- antigrav engine pad (square base, glowing cyan #40c0c0 coil ring, exhaust vents pointing outward)
- solar panel arrays (rectangular grid of cells, 2×1 / 2×2 / 3×1 sizes, cyan panel surface with dark grid)
- parabolic comm-dish antenna (circle with lighter-grey dish face, central feed-horn dot)
- whip antennas (thin vertical poles with base plate)
- robotic service arm (articulated, two joints, folded rest position)

=== STYLE ===

STRICT 2D TOP-DOWN ORTHOGRAPHIC FLOOR PLAN. Looking straight down at 90°. No perspective, no isometric tilt, no 3D foreshortening, no diagonal walls. Every wall horizontal or vertical. Circular domes/tanks/dishes read as clean circles from above.

CHUNKY LOW-RES PIXEL ART (V1 constraint). Each asset is a 16×16, 24×24, 32×32, or 48×48 native pixel-art sprite rendered at 4× zoom. Every visible feature occupies at least 2×2 pixels — NO sub-pixel detail, NO fine outlines, NO thin antennas that blur. Blocky, primitive, 8-bit home-computer era (think ZX Spectrum, C64, Dwarf Fortress / Cogmind / RimWorld tiles).

NO ANTIALIASING. NO GRADIENTS. NO BLUR. Flat color blocks with hard pixel edges. One dither pattern allowed for light transitions, nothing else.

ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO LOGOS, NO SYMBOLS anywhere on any sprite.

=== LIGHTING ===

Directional light from a bright star far LEFT of frame. Every volumetric element (dome, tank, sphere, antenna pole, girder) casts a HARD-PIXEL SHADOW extending to the RIGHT of the sprite, on the same 2D floor plane. Shadows are flat dark-grey patches (use palette #1a1e28 or #2e3440), pixel-edged, never soft or gradient. Shadow length roughly equals element height. Flat plates and floor tiles cast no shadow. The lit (left) edge of each raised element gets a bright highlight pixel row in #c0c4cc or #ffffff.

=== PALETTE (STRICT — 16 colors ONLY, pick from this list, nothing else) ===

Hull/metal/void: #0a0a10, #1a1e28, #2e3440, #4c5462, #6a7080, #8a8e98, #c0c4cc
Status accents: #ff4848 (alert/red), #ff8020 (warn orange), #ffc030 (warn amber), #60c060 (bio green), #4088c8 (info blue), #40c0c0 (coolant cyan — use for solar panels, antigrav coils, shields)
UI/amber: #b08030 (amber dim), #ffd060 (amber bright — window glows, lit panels)
Highlight: #ffffff (sparingly, only specular highlights on lit edges)

Chroma-key: #FF00FF — background ONLY. NEVER inside any sprite. No pink, fuchsia, purple-pink, magenta variations anywhere inside content.

=== CRITICAL BACKGROUND RULE (V4) ===

The background color of the ENTIRE sprite sheet MUST be pure, saturated bright magenta, RGB exactly (255, 0, 255), hex #FF00FF. This is a chroma-key color that will be converted to transparency by an automated script. If you use red, pink, fuchsia, coral, crimson, hot pink, or any near-magenta shade like (255, 0, 213) or (252, 52, 164) — the output is unusable and the task fails. No gradient. No antialiasing halo around sprites. No dithered background. Solid uniform pure magenta fill only. Verify before export.

OUTPUT FORMAT: PNG only. No JPEG — lossy compression destroys the chroma-key.

=== LAYOUT OF THE SHEET ===

Large sprite sheet (e.g. 512×512 or 1024×1024). Assets placed loosely, NOT in a rigid grid — just scattered with at least 16 px of pure magenta between each sprite so they can be cut out individually. Group similar items loosely (structural parts in one area, habitat/function modules in another, pipes/cables in another). But no borders, no text captions, no numbers.

One mood: industrial, functional, weathered but not rusty. Dune II meets RimWorld meets Cogmind — from directly above.
