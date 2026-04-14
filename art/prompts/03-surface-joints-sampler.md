Pixel-art top-down TEXTURE / DETAIL sampler for a retro CRT sci-fi colony sim ("Voidspan"). One large sprite sheet on solid pure magenta #FF00FF background (chroma-key). Two distinct sampler sections, clearly separated by a wide (at least 48 px) magenta gutter.

=== SECTION A — SURFACE DETAIL SAMPLER ===

A grid of ~24 individual square tiles, each 48×48 native (rendered at 4× zoom). EVERY tile has the SAME base color: solid metal-gray #6A7080. On top of that base, each tile shows ONE specific surface treatment, drawn in strict Voidspan palette:

A1. Clean base (reference tile, just flat #6A7080)
A2. Light noise — scattered darker pixels (#4c5462, #2e3440), low density (~10%)
A3. Heavy noise — dense darker speckle (~30%), gritty worn look
A4. Brushed metal streaks — horizontal darker pixel lines, uneven spacing
A5. Dither gradient — left edge bright (#8a8e98), right edge dark (#2e3440), hard-pixel dither band between
A6. Directional highlight — top-left corner rows in #c0c4cc / #ffffff, fading down-right
A7. Directional shadow — opposite, bottom-right corner in #2e3440 / #1a1e28 (simulates raised plate)
A8. Panel seam — straight vertical groove line across middle, one pixel wide, #1a1e28
A9. Rivet cluster — 6–8 chunky rivets (2×2 px each, #c0c4cc highlights, #1a1e28 shadow to right of rivet)
A10. Weld bead — irregular horizontal line, amber glow accents (#b08030, #ffd060)
A11. Rust patch — warm orange/amber stains (#b08030, #ff8020), organic edge, partial coverage
A12. Deep rust — aggressive #ff4848 + #ff8020 corrosion, pitting visible (holes showing #0a0a10)
A13. Oil stain — glossy black patches (#0a0a10), uneven edge, reflective highlight dot (#c0c4cc)
A14. Scorch mark — charred center (#0a0a10), orange/red ring (#ff4848, #ff8020) fading outward
A15. Dent / impact — ring of darker pixels around central crater (#1a1e28 center → #4c5462 rim)
A16. Scratch — long diagonal hairline scratch, #c0c4cc bright
A17. Bacterial growth — irregular biological patch, #60c060 with #b08030 edges, fuzzy organic outline
A18. Mold / fungus — cooler greenish blotches, #60c060 with dithered #4088c8 core
A19. Frost / ice — #40c0c0 cyan crystal pattern, branching
A20. Coolant leak — dripping cyan streaks (#40c0c0) running downward (but rendered as flat top-down puddle)
A21. Electrical burn — amber/white arc scar (#ffd060, #ffffff), radiating spark pattern
A22. Chemical stain — warn-orange splotch (#ff8020) with darker #b08030 rim
A23. Faded paint — patchy mix of #6a7080 and slightly tinted variants, worn edge
A24. Graffiti-style scratch mark — random geometric shape hand-etched, #1a1e28 lines (NO letters, NO numbers, just abstract geometric gouges)

Arrange as 6 columns × 4 rows of these 48×48 tiles, tightly packed but with 4 px magenta separator between tiles inside this section.

=== SECTION B — TRANSITIONS & JOINTS SAMPLER ===

A grid of ~20 larger sprites (64×64 each), again on #6A7080 base, each showing a transition, seam, or joint between surfaces / modules. Industrial sci-fi floor-plan style.

B1. Straight seam — two plates meeting along vertical line, beveled #4c5462 groove, rivet row
B2. Cross-joint — four plates meeting at center, raised cross-shaped cover plate
B3. T-junction — three plates meeting, one bridging over
B4. L-corner — two plates meeting at 90°, beveled corner
B5. Expansion gap — wide dark groove with gleaming metallic inset (#c0c4cc)
B6. Grated transition — half tile solid, half tile catwalk grating (dark diagonal pattern through)
B7. Bulkhead threshold — raised hard divider (rectangle in #4c5462) across middle
B8. Door frame (closed) — amber-glow strip between two plates
B9. Airlock seal — circular gasket pattern, concentric rings (#2e3440, #4c5462, #8a8e98)
B10. Access panel edge — inset rectangle with 4 corner screws
B11. Hatch cover — circular or hex shape with central handle
B12. Cable channel — sunken rectangular trough with visible cables (#b08030, #40c0c0)
B13. Pipe passage — round hole in plate where pipe exits, with flange ring
B14. Rail / track — parallel metal rails inset into plate
B15. Vent grille — parallel slits cut into plate, deep shadow inside (#0a0a10)
B16. Ladder top — rectangular opening with rungs visible below (#2e3440)
B17. Stair transition — step up, with visible riser and tread
B18. Joint corrosion — seam with rust bleeding into both sides
B19. Welded patch — irregular metal patch welded over damage, seam visible
B20. Hinge — two plates connected by a simple top-down hinge pin

Arrange as 5 columns × 4 rows of 64×64 sprites, magenta separators.

=== UNIVERSAL STYLE RULES ===

STRICT 2D TOP-DOWN ORTHOGRAPHIC — looking straight down at 90°. No perspective, no isometric tilt, no diagonal walls, no 3D shading gradients. Each tile/sprite is viewed from directly above.

CHUNKY PIXEL ART. Native resolution per tile as specified (48×48 or 64×64), rendered at 4× zoom. Every visible feature at least 2×2 pixels. No sub-pixel detail.

NO ANTIALIASING, NO BLUR, NO SOFT GRADIENTS. Flat color blocks with hard pixel edges. One hard-pixel dither band acceptable where a transition is needed.

DIRECTIONAL LIGHTING: star far LEFT. Every raised/volumetric element (rivets, rims, weld beads, hatch covers) gets a BRIGHT HIGHLIGHT pixel on its left edge (#c0c4cc or #ffffff) and a HARD-PIXEL SHADOW on its right edge (#2e3440 or #1a1e28). Shadow length ~= element height. Flat stains/puddles/paint have NO shadow. Consistent direction across ALL tiles and sprites.

ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO LOGOS anywhere.

CRITICAL BACKGROUND RULE: The background color of the ENTIRE sheet MUST be pure, saturated bright magenta, RGB exactly (255, 0, 255), hex #FF00FF. This is a chroma-key color that will be converted to transparency by an automated script. If you use red, pink, purple, fuchsia, coral, crimson, hot pink, or any OTHER color for the background — even a near-magenta shade like (255, 0, 213) — the output is unusable. No gradient on the background. No antialiasing ring around sprites. Solid uniform pure magenta fill only. Verify before output.

OUTPUT FORMAT: PNG only. Do not output JPEG — lossy compression destroys the chroma-key.

=== PALETTE (STRICT — 16 colors ONLY) ===

Base metal (MANDATORY for every tile base): #6A7080
Hull/void darks: #0a0a10, #1a1e28, #2e3440, #4c5462
Metal lights: #8a8e98, #c0c4cc
Status accents: #ff4848 (rust/burn), #ff8020 (deep rust/warn), #ffc030, #60c060 (bio growth), #4088c8 (electrics), #40c0c0 (frost/coolant)
Amber: #b08030 (tarnish), #ffd060 (glow/spark)
White: #ffffff (sparingly, specular only)

Chroma-key: #FF00FF — background ONLY. Never inside any sprite.
