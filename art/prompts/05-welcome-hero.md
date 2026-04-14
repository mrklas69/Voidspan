Pixel art hero illustration for the welcome / splash screen of a 2D top-down strategy game "Voidspan". Cinematic, painterly, one-off hero art (not a sprite sheet, not a gameplay asset).

SCENE — "Inception curl":
A massive orbital belt — a thin chain of connected space-station segments — arcs around a distant red dwarf star. The ring is bent upward toward the viewer in a dramatic Inception-style curl: it starts in the foreground as a relatively flat horizontal strand, then curves steeply upward and recedes into the distance, as if gravity itself has folded the horizon. The belt's far side wraps around behind the star, silhouetted against its dim red corona. One segment of the ring nearest the viewer is faintly highlighted with amber cabin lights — "this is where you will watch from". No Earth, no planets in the frame. Just the void, the star, and the belt.

CAMERA:
Low three-quarter angle from a viewpoint just outside the orbital plane. Forced perspective. The belt dominates the frame diagonally, occupying roughly 60% of the composition, curving from lower-left foreground up to upper-right distance. Teegarden's Star (a small red dwarf, not a big sun) sits in the middle distance, partially eclipsed by the far side of the belt.

LIGHTING:
Single hard light source from the red dwarf. Belt segments are silhouetted on their star-facing side (rim-lit in amber / status-red), dark on their shadow side (hull-dark void). Small pixel highlights of warm orange where cabin lights or docking bays face outward. No secondary lights, no ambient fill except faint starlight.

PALETTE — strict 16 colors from Voidspan palette:
- void space: `#0a0a10` (void-black), `#1a1e28` (hull-dark)
- belt metal: `#2e3440` (hull-mid), `#4c5462` (hull-light), `#6a7080` (hull-brighter neutral)
- star + rim light: `#c48800` (amber-dim), `#f7d90c` (amber-bright), `#d24f3b` (status-red corona edge)
- cabin / warning lights: `#ff8800` (status-orange), small accents `#40c0c0` (coolant-cyan) for shield glints, `#4fd264` (status-green) on one friendly segment
- stars in background: single-pixel `#cfd4dc` (text-dim) dots, sparse
NEVER use colors outside this 16-color list. No pastels, no gradients between non-adjacent palette slots.

STYLE:
- Chunky pixel art. Hard pixel edges, no antialiasing, no blur, no motion blur, no bloom, no lens flare, no depth-of-field.
- 8-bit / 16-bit era aesthetic (think Another World, Out of This World, Homeworld intro cutscenes rendered at pixel scale).
- Painterly dithering allowed for star corona and void gradient (Bayer / ordered dither patterns only, no noise).
- Belt segments read as ~3-5 pixel modules linked by thin connector struts — chunky but legible at intended resolution.
- Star corona: 2-3 concentric pixel bands (amber-dim → amber-bright → status-red edge), dithered transitions.

RESOLUTION & OUTPUT:
- Native resolution 320 × 180 px (16:9, integer scaled ×4 to 1280×720 for display).
- PNG only (no JPG — halos destroy pixel edges).
- Full opaque background (void-black). NO chroma-key transparency needed — this is a complete image, not a sprite.
- Single image, no grid, no sheet.

FORBIDDEN:
- Text, letters, numbers, logos, HUD elements, UI chrome, pointer cursors.
- Humans, faces, hands, creatures.
- Earth, planets, moons, asteroids, ships, capsules.
- Non-palette colors. No neon pink, no teal-not-coolant-cyan, no purples, no browns outside hull range.
- Photorealism, CGI smoothness, realistic physically-based lighting, HDR.
- Perspective lines exceeding 3-point; no extreme fish-eye.

MOOD:
Contemplative, vast, silent. The viewer is a small observer peeking at an enormous construction project that has been running for generations. Not hostile, not welcoming — indifferent scale. A belt bent like Paris folded in Inception, but colder, older, made of metal and patience.

OUTPUT: one 320×180 PNG, strict 16-color Voidspan palette, hero splash composition.
