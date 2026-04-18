# MINDMAP.md — ⊙ Voidspan

Myšlenková mapa projektu. Slouží k nalezení fokusu: **kde máme maso, kde díru, co je záclona a co základ**.

Aktualizuj kdykoli se změní struktura projektu (nový bod, přejmenování, přesun). Stav naplnění značí, kolik je v dané větvi skutečně rozhodnuto.

**Legenda stavu:** `[●]` plné / `[◐]` rozpracováno / `[○]` prázdno / `[✕]` zrušeno.

Verze: **v4.3** (2026-04-18, konec sezení 35 — **Neon paleta + procedural ship render (ShipRender) + Tabler SVG ikony + semafor barva modulů**). Hlavní změny:
- **Paleta přepsána na Neon** (palette.ts). 5 rating tónů z neon výbojkové rodiny: rate-5 electric mint-lime `#39ff5e`, rate-4 **acid lime-yellow `#b8ff2e`** (S35 přemapování z cyan), rate-3 solar amber `#ffb020`, rate-2 hot plasma orange `#ff6a1f`, rate-1 sodium plasma red `#ff2850`. Cyan zachován jako Storage/Fluids kanon (`UI_STATUS_COOLANT`, `HEX_KIND_STORAGE`), ne rating barva. UI amber saturovanější (`#ffd060 → #ffd94a`). VOID_BLACK `#0a0a10 → #000510` (jemný modrý nádech). Canvas BG `#000000` (pure black, neony lépe vyniknou).
- **Nová sekce §1b: KIND_* konstanty** — 8 per-module identity hue (Habitat orange, Solar yellow, Storage cyan, Assembler magenta, Dock azure, Engine mint teal, MedCore cryo blue, CommandPost neon violet). Pro budoucí decorative accent. V S35 ship render je ale nepoužito — barva modulu = semafor podle HP%, ne kind.
- **Nový `RATING_COL` + `ratingColorNum(pct)`** — number varianta (paralela k existující HEX `RATING_COLOR` / `ratingColor`). Phaser fillStyle/setTint potřebuje number.
- **`palette-preview.html`** (nový, `apps/client/public/`) — statická reference pro novou paletu: 5 rating swatches s glow halo, 8 per-kind outline karty, 4 status cells izomorfismus (online/damaged/offline/build), UI chrome sample, mapping tabulka starý → nový. Původní `style-guide.html` zachován jako Hull & Amber archiv.
- **ShipRender procedural** (`apps/client/src/game/ui/ship_render.ts`, 433 LOC) — Phaser.Graphics outline + fill + Tabler SVG glyph + asteroid flash + selection. Status modulace: online solid, damaged dashed outline + HP fill zleva, offline grey + checker, building dotted + progress fill. Void = dashed grey + „+" glyph. Sdílí public API se SegmentPanelem (render / relayout / attachTooltips / moveSelection / getSelectedBayIdx).
- **Feature flag `USE_PROCEDURAL_RENDER = true`** v `tuning.ts §11`. Default po S35, SegmentPanel (298 LOC, 8 PNG module assetů) zůstává jako rollback safety net. Cíl: retire v S36 po stabilizaci.
- **Tabler SVG ikony** (MIT, 9 ikon) — `public/assets/icons/{home,solar-panel,package,hammer,anchor,engine,first-aid-kit,broadcast,cube}.svg`. `stroke="currentColor"` → `#ffffff` pro tint compatibility. Mapping: Habitat=home, Solar=solar-panel, Storage=package, Assembler=hammer, Dock=anchor, Engine=engine (Tabler má přímo), MedCore=first-aid-kit, Command=broadcast, fallback=cube. Preload: `this.load.svg("icon:Kind", url, { scale: 2 })`. Fallback graceful degradation pokud textura chybí.
- **Barva modulu = semafor HP%** — izomorfismus s ModulesPanelem (user explicit). Outline + HP fill + glyph tint všechny přes `ratingColorNum(hpPct)`. HP 80 % = rate-5 green, 70 % = rate-4 lime, 50 % = rate-3 amber, 30 % = rate-2 orange, 10 % = rate-1 red. Offline jediná výjimka (grey, ne semafor).
- **Animace active tasku** — moduly s aktivním repair/build/demolish taskem mají outline alpha pulsuje yoyo sin 0.5..1, perioda 2 s. HP fill static (skutečné HP%), ne animovaný. Směr (ascending/descending) se dnes vizuálně neliší (z původní volby po user korekci) — tooltip drží `repairStateText` pro detail. Pulse phase a activeTaskModuleIds Set precomputed 1× na `render()` (ne per-bay).
- **/simplify pass** — 3 agenti paralelně. **Fixed (5):** (1) activeTaskModuleIds Set preflight, (2) pulse phase hoist, (3) drawDashedLine closure retirace → private method, (4) Math.hypot → axis-aligned abs sum (zero sqrt), (5) USE_PROCEDURAL_RENDER komentář konsistence. **Deferred (2):** repairStateText/bayTooltipText duplicate s segment.ts (S36 retire vyřeší), findActiveTaskForModule extract (rule-of-two future).
- **Memory update** — `feedback_numbered_questions.md` rozšířen: číslování Q napříč celou session (ne reset per message).
- 101/101 testů zelených, TS strict clean. `ship_render.ts` 433 LOC (pod LOC cíl ≤500).

Verze: **v4.2** (2026-04-18, konec sezení 34 — **Art pipeline cesta C rollback + AI arena brief + Gemini style extraction mix v1+v2**). Hlavní změny:
- **Cesta C integrační test — FAIL.** Habitat 2048² + hull_tile 1024² shippované přes ad-hoc Python chroma-key pipeline (`scripts/build-assets-hires.py`, Pillow), integrace v `segment.ts` (16 hull sprites + deterministická rotace `(idx × 7) % 4 × π/2` + uniform contain scale × `MODULE_OVERLAY_SCALE = 0.75`, feature flag `USE_HULL_OVERLAY`). User vizuální test: **nefunguje**. Rollback přes `git checkout` pro art/, public/assets/, tuning.ts, GameScene.ts, segment.ts. Staré 40×40 pixel art zpět.
- **Pivot: AI arena brief místo per-modul generation.** Diagnóza proč cesta C selhala: Chris Foss painterly = retro Dune II rip-off, AI generation roulette, asset pipeline overhead, nulové využití Phaser shaderů. Brief (`art/arena_brief.md`) pro arena.ai: self-contained prompt, 3 zóny (header metriky + bottom bar + centrální LOĎ stavebnice), 8 modulů z našeho katalogu, anti-vzory (NASA loď, Chris Foss, generic sci-fi UI), styl jen jako doporučení (neon hologram / blueprint / data-viz / cyberpunk).
- **Arena kolo 1 (Gemini dashboard, `art/arena_winners/gemini_1.png`)** — hit estetika (neon hologram), damage přes particles, funkční modul ikony, affordance labels. Problémy: grid ne 8×2, moduly mimo katalog, CZ typo, event timeline always-on strip, Player mode akce.
- **Arena kolo 2 (Gemini blueprint, `gemini_2.png`, user si vyžádal zjednodušenou verzi)** — dark navy + thin outlines + wireframe decor, plně česky. Damage přes zig-zag + dashed yellow border, OFFLINE přes checkered pattern. Jednotky bug (Wh místo m³/L), stavebnice NEDORUČENA (všechny 1×1), moduly mimo katalog.
- **User verdict: mix v1 + v2.** v2 blueprint klid (base) + v1 glow/particles action (damage/build/completion). Arena uzavřena po 2 kolech, vzato jako nezávazná inspirace.
- **IDEAS: 2 nové sekce** — „Art pipeline pivot — AI arena brief (S34)" s diagnózou/retire list/Q1-Q4 + „Style extraction — mix v1 + v2" s paletou per modul kind (8 barev), status izomorfismem (ONline solid / DAMAGED dashed / OFFLINE checkered / staví se progress), functional glyph ikonami, implementation outline pro S35+ (`ship_render.ts` replace, Phaser.Graphics + FX.Glow + Particles, LOC target ≤500, žádné PNG).
- **Úklid:** retire `art/pokus1.md`, `art/prompts/pokus2/` (8 souborů), `art/prompts/pokus3/hull_tile.md`, `scripts/build-assets-hires.py`. Revert `package.json` alias. Settings konsolidace (přidán `python:*` wildcard, 4 granulární `cp` entries smazané).
- **Technická lekce:** `pnpm build:assets` je dedikovaný na 40×40 pixel art (downscale na 36×36). Pokus o hires assety (1024²+) skrz tento pipeline je prohra bez obcházky. Pokud se k hires někdy vrátíme, `build-assets-hires.py` už neexistuje — je v git history (commit S34 @END).
- 101/101 testů zelených (beze změny), TS strict clean. Code untouched (all rollback success).

Verze: **v4.1** (2026-04-18, konec sezení 33 — **v0.9 bump + audity CODE/DOCS + Mission Scenario + Narrative voice + Art pipeline pivot**). Hlavní změny:
- **v0.8 → v0.9 bump** — package.json root + client, PLAYTEST_GUIDE.
- **QM Terminal `buildTerminalBody(w)`** — runtime substituce placeholderů `{E/W/S/F}` z World, `[Nestabilní!!!]` ASCII tag (modal nepodporuje inline barvu); `SEED_CREW_CRYO` import, `SEGMENT_ADDRESS` konstanta. Při každém [Q] open čte živé metriky.
- **Modal font 20 → 18 (SIDEPANEL sjednocení)** — Help + Terminal mají stejnou hustotu dat jako boční panely. `FONT_SIZE_PANEL` zůstává pro commandButton + ActorsPanel.
- **Blikající kurzor v modalu** — `ModalOptions.cursor?: boolean`, Rectangle geom (font-agnostický, `█` U+2588 mimo Atkinson subset), tween yoyo alpha 1→0.2 @ 500 ms, named constants `CURSOR_ASPECT/V_INSET/GAP`, edge case guardy.
- **Mission Scenario v0.1** (`IDEAS.md`) — 7-aktový oblouk (Tranzit → Arrival → Refit → First Wake → First Society → Signál → Choices → Belt Closure), autorské beats (tónový arc samota→iterace, reveal discipline, T1 Earth „neosvobozená"), Q1-Q4 otevřené.
- **Narrative voice axiomy + E1-E8 sandbox** (`IDEAS.md`) — 6 axiomů (Event = lidská věta / suchý tech tón / čísla > adjektiva / koncovka jako pointa / scéna bez hudby / ASCII-safe + CZ display) + Before/After existujících event textů + 8 tón-first povídek napříč akty.
- **@AUDIT:CODE + @AUDIT:DOCS** (`audit/audit_260418_*.md`) — 7 dluhů z S32 vyřešeno; 5 nových (F1 FloatingPanel destroy listener cleanup deferred, F2 terminal magic strings → konstanty fixed, F4 stale `LOSS` komentář fixed). Docs: SPECIFICATION §4.5 Slab/Flux/Kredo retire, GLOSSARY II.1 food/air/water retire, PLAYTEST_GUIDE skeleton/covered + REPR retire + [Q] panel, POC_P1 refs napříč 14 soubory cleanup.
- **/simplify pass** — REAL BUG: tween leak v `ModalManager.close()` (Phaser nezabíjí tween při destroy targetu, infinite repeat akumuloval) → `killTweensOf(obj)` před destroy. + `HexStringToColor(UI_TEXT_PRIMARY).color` → `COL_AMBER_BRIGHT` direct. + named cursor constants. + edge case guardy. Vedlejší nález: `background.ts` má stejný tween leak pattern (zapsáno, neopraveno).
- **Art pipeline pivot** — opuštění 40×40 native + 16-color paleta. Pokus 1 (tile sheet 5×4 grid v jednom obraze) selhal: AI ignoruje footprinty, stíny na bg, uniform look, garbage text. **Pokus 2** = per-modul generation (`art/prompts/pokus2/{8 modulů}.md`), 1 prompt = 1 obraz = 1 modul, shared style boilerplate + unique silhouette. Habitat output (Gemini) krásný — odhalil **strukturální problém**: ISS-style moduly nesedí do compartment-style BELT layoutu. **Cesta C zvolena** = hull base + module overlay 75 % (hull = chassis, moduly = subsystems). **Pokus 3** (`art/prompts/pokus3/hull_tile.md`) — square 1024² tileable hull plating, painterly Chris Foss/Peter Elson, gunmetal restrained palette. Imagen 4 Ultra output dobrý (octagonal hatch + cable + grille focal — accept jako „bolted modular construction"). Zbývá 7 modulů (Engine/Dock/MedCore/Assembler/Solar/Storage/CommandPost), pak integrace `segment.ts` (hull base + module overlay + random `setRotation(90°×rand)`).
- 101/101 testů zelených, TS strict clean. Memory `feedback_single_process_machine.md` (zombie shell zabít bez ptaní).

Verze: **v4.0** (2026-04-17, konec sezení 32 — **@AUDIT:CODE + 7 dluhů + FloatingPanel base + QM Query terminal + M-110 DSO**). Hlavní změny:
- **@AUDIT:CODE** (`audit/audit_260417_code.md`) — 4 z 5 dluhů S28 vyřešeno (world.ts extrakce, InteractiveGameObject, ESC handler, UI_MASK_WHITE). Test coverage 9.5 % → 16.5 % (+74 %). Axiom skóre 13/13 ✅.
- **7 nových dluhů vyřešeno v jednom sezení** — F1 stale komentáře (14 míst v 5 souborech), F3 iconText dead field v InfoPanel, F4 `SEVERITY_COLOR` type narrowing (`Record<EventSeverity, string>`), F5 `SEED_DRONES` konstanta v tuning.ts, F6 `appendEventLog` slot retire (pipeline 12 → 11 slotů, events in-place), F2+F7 `FloatingPanel` base class.
- **`FloatingPanel` base class** (208 LOC, `ui/floating_panel.ts`) — extraktuje chrome + visibility + dock + scene listener lifecycle. `PanelSlot = "top-left"|"bottom-left"|"top-right"|"bottom-right"`, `computePosition()` derivovaná ze slotu. Abstract `buildBody()`+`renderBody()`. 4 panely migrovány: InfoPanel 384→272, ModulesPanel 414→326, EventLog 507→380, TaskQueue 318→203. **Celkem −442 LOC, net −234 LOC** po base class.
- **POC_P1.md smazán** (user volba B) — historický artefakt z S6/S7, popisoval single-player puzzle s WIN/LOSS (retired S20/S21 pivotem na Perpetual Observer). Unique info zachycena jinde.
- **Kurzor ruky globální fix** (Censure! — oprava) — `tooltip.ts` attach() nastavuje `scene.input.setDefaultCursor('pointer'|'default')` **dynamicky** v `pointerover`/`pointermove` podle `provider() !== null`. Izomorfismus: kurzor signalizuje dostupný infotip.
- **QM Communication Terminal** (IDEAS S31 varianta A) — nový `terminal.ts` (71 LOC), [Q]uery command v Bottom Baru, hotkey Q, auto-open při prvním spuštění (LS flag `voidspan.terminal.dismissed`), suchý tech tón QM persona. Modal reuse `ModalManager` (žádný vlastní scroll). **Welcome dialog retire** — `welcome.ts` (376 LOC) + `splash/welcome.png` + Help „Zobrazit uvítání" tlačítko smazáno. 1-col layout po user iteraci.
- **DSO swap M-42 → M-110** — iterace 1 plný M-31 Andromeda (7 SVG parts, halo/disk/core/dust_lane/satellity M32+M110) byl přeplněný. Iterace 2: KISS redukce na samotné M-110 (eliptická satelitka, protáhlá rotace -20°, gold-amber gradient). Folder `m31/` → `m110/`, `M31_*` → `M110_*` v background.ts, offset (80, 110) = pozice původního M-32.
- **LOC src/game: 6 549 → 6 092** (−457 LOC). Max soubor: `model.ts` 467 (katalog). 101/101 testů zelených, TS strict clean.

Verze: **v3.9** (2026-04-17, konec sezení 31 — **UX polish + EventVerb redukce + DSL/AI IDEAS + v0.8**). Hlavní změny:
- **EventVerb 25 → 9** — retire 16 verbů nepoužívaných v v0.7 (SPWN, ARRV, DPRT, REPR, BLD, DEMO, PROD, HAUL, FAIL, IDLE, WAKE, DOCK, TICK, EVNT, SAY, RPRT). Zachovány: SYST, DEAD, DECY, DMG, DRN, SIGN, ASSN, TASK, CMPL. Severity sets zredukovány, GLOSSARY Verb Catalog přepsán (9 aktivních + 16 retirovaných s návratovým triggerem R2/P2+).
- **InfoPanel** — 3. řádek Drony (working/idle/offline) + hierarchický formát (kapitola + odsazená podkapitola, izomorfismus s kvintet tooltipy). COL_OFFSET → 0, iconText prázdný.
- **ModulesPanel** — 3 řádky agregátů retirovány. 5-sloupcová tabulka: `Kind (id) status HP% task_state`. `moduleStatusCs()` (OK/poškozeno/zničeno/offline/staví/demoluje) + `moduleTaskState()` (plán/oprava.../nelze). Zebra cyklus added→zjemněno→pryč. **5-color semafor per řádek** (setColor na RATING_COLOR). `statusIcon()` retire (dědictví S27 lampičky). Fix „poškozeno 100%" floating-point artefaktu (porovnání s hpPct int, ne raw hp).
- **S/F tooltip** — partial-day fallback. Nový `currentDayRate()` helper v world/flow.ts — když `flow.filled === 0`, extrapolovat partial bucket × (DAY/elapsed). User vidí drain během prvních 4 min wall, ne až po rotaci window.
- **EventLog chip sync** — `syncSeenVerbs()` helper volaný v constructor + toggle(). Eliminuje 1-frame delay mezi SYST eventem a SYST chipem.
- **v0.7 → v0.8 bump** — package.json (root + client), PLAYTEST_GUIDE.md.
- **IDEAS** — 2 nové sekce: **Protocol DSL (S31+)** s paradigma tabulkou (A–E) + reference-text test suite (user slovní plán → DSL v0) + upgrade path mapping + Q1–Q15. **QM Communication Terminal (S31+)** — vize AI terminalu + 8 červených vlajek oponentury + hybridní varianty A/B/C/D + path forward (A→B→C→D) + Q1–Q8.
- 101/101 testů zelených (beze změny; nové features testovány přes live dev server).)

Verze: **v3.8** (2026-04-17, konec sezení 30 — **iterace po S29**). Hlavní změny:
- **Lazy filter chips v EventLog** — `verbFilters` LS persist, wrap 2 řádky abecedně, click toggle, default all ON; chip font 9 px, underline pryč.
- **Bottom Bar** `[I]info` → `[I]nfo` napříč 5 položkami (úspora 5 znaků).
- **Ellipsize v row panelech** — `ellipsizeText` binary search helper. ModulesPanel single blob → per-row pair (kindIdText ellipsize + statsText fix column). TaskQueue lead + suffix dynamic right-aligned.
- **Tooltip na ořezaných řádcích** — provider vrací plnou verzi jen když byl ořez; 3 panely mají attachTooltips.
- **Asteroid system + pomalý decay** — `DECAY_RATE_PER_GAME_DAY` 150× pomalejší (0.0000667), `scheduledEvents` slot 9 aktivní: 1× / 10h wall hit na random non-void bay, 5-20 % hp_max damage, 600ms red flash overlay (`Module.flashUntilTick`).
- **M-42 Orion Nebula** — random DSO retirován, 7 SVG parts (3 wisps smazány) fixed world pos `(220, 180)`, scale 0.55, BlendMode.ADD/NORMAL, `preloadM42()`.
- **Pevné 2×2 layout panelů** — mutex I↔M + E↔T zrušen, `PANEL_HALF_H = 367` (+30 %), `PANEL_WIDTH_STD = 460`, 4 panely otevřené současně.
- **Cryo failure (slot 6 actorLifeTick)** — všechny MedCore HP=0 → 32× DEAD, jeden aggregate event.
- **Help modal 2-col** — `ModalOptions.bodyLeft/bodyRight`, PANEL_W 520→720 při 2-col.
- **Footers odstraněny** z EventLog (count + 📋) a TaskQueue (count).
- **BOOT → SYST** (Censure! po SYS 3-char pokus; memory `feedback_convention_audit.md`).
- **cost_coin retirován** — zavádějící (FVP neutrácí); katalog `recipe` převeden na **TOTAL** hodnoty místo per-HP rate (getTaskRecipe dělí hp_max za běhu).
- 101/101 testů zelených (88 → 101 tests).)

Verze: **v3.6** (2026-04-17, konec sezení 28 — **Code audit + 6 cleanups + 2 retire + dokovací MVP**. @AUDIT:CODE první od 04-13 (`audit/audit_260416_code.md`). F1 extrakce `world.ts` (1166 LOC) → `world/` (14 souborů, max 195 LOC). F4/F6 type helper + UI_MASK_WHITE. F5 globální ESC priority chain. F2 lightweight DRY (panel_helpers). F3 logic-only smoke testy 53→88. **Asteroid system retire** (orbit.ts smazán, IDEAS sekce). **Drift 7→30** + **damage 3→1** (START_DAMAGE_HP_RATIO). **Layered bay axiom retire** (skeleton/cover smazáno, Bay union zúžen na void/module_root/module_ref, BAY_DEFS retired, side_right.ts dead code smazán). **Loď kompaktní** — 8 modulů (Hab + 2× Sol + Med + Ass + CP + 2× Sto) přilepených k motoru (cols 2-5), 4 void vlevo. **BrandIcon ⊙** Phaser Graphics (font-independent, vrací S27 ASCII fix). **Bottom Bar** mezery odebrány. **Font 3-level konsolidace** — 11 konstant → 3 (CHROME 24 / PANEL 22 / TIP 20). **T: prefix split** (formatGameTime / formatGameTimeShort). **ModulesPanel UX** — repair branch retire + Stav modulů 5color rating header. **Dokovací MVP** — DockManager + BELT re-centering (axiom „BELT vždy viditelný; panel ustupuje, ne naopak"). 88/88 testů zelených.)

Verze: **v3.5** (2026-04-16, konec sezení 27 — **Font glyph fallback fix** (MINDMAP „Další bagr" #12 ✅). VT323 latin-subset z Google Fonts nemá geometric/dingbats/exotické arrows → browser fallback rozbíjel baseline. KISS ASCII substituce napříč rendered code: events.ts VERB_CATALOG (24 entries: ◉→`*`, †→`x`, ▽→`v`, ↘→`\`, →→`>`, ☆→`~`, ⊙→`()`, ⚑→`>>`, ◆→`<>`, ◈→`#`, ✓✓→`OK`), header.ts E/W/S/F tooltipy (▤▲▼Σ☻¤✓ drop, `→/←/∅`→`>/</avg`, brand ⊙→`O`), modules_panel statusIcon ASCII (●○▯▼✕→`o_^vX`), task_queue (`✓`→`OK`, `✕`→`X FAILED`), info_panel/event_log/task_queue/modules_panel close `✕`→`X`, welcome OBS-∷→OBS-··, GameScene help modal ▤⊙▨ drop, world.ts SIGN text `→`→`>`. Zachováno: `↑↓ × » · −` (latin subset / Latin-1). 53/53 testů zelených, TS strict.)

Verze: **v3.4** (2026-04-16, konec sezení 26 — **FVP KISS resources** (ploché S/F/C bez subtypů, metal/components/water/coolant → P2+). **Rolling-window KPI** (FlowHistory ring per game day, `FLOW_WINDOW_GAME_DAYS = 10`, S/F tooltipy s Kapacita/Příjmy/Výdaje/Bilance/Runway slovně). **Coin žlutá placeholder** bez tooltipu. **32 cryo crew** (SEED_CREW_CRYO, MedCore 32 cryolůžek). **ModulesPanel [M]** (nový, levý mutex s [I], per-module stats + task progress). **InfoPanel redukce** (jen Posádka + Základna). **VT323 font** (CS-complete) + **+2 px scale bump** + `FONT_SIZE_TOOLTIP`. **Observer Edition release prep** (v0.7, welcome text přepracován na Pozorovateli / 32 cryo / cílová orbita / Teegarden's Star, help plně CZ, PLAYTEST_GUIDE.md v rootu). **Build ID** injection přes Vite define (`__BUILD_ID__` v identity tooltipu). 53/53 testů zelených.)

Verze: **v3.3** (2026-04-16, konec sezení 25 — **Software třída** (`Software = { id, name, version, draw_w, status }`, QM v2.3 draw_w 0.86 W). **Recipes M:N** (per-Modul/Bay `ResourceRecipe`, repair drénuje per recipe, gate na deficitu kterékoli složky). **Slab/Flux → Pevné/Solids, Tekutiny/Fluids** (kvintet rename + bulk rename v kódu). **Resource Taxonomy** (rarity 5 stupňů + logistics matrix, P2+ design baseline). **Food + Air retire** (KISS — 24th-cent recyklace, food je atribut item ne kategorie). FVP subtypy: Solids = {metal, components}, Fluids = {water, coolant}. **Drone E drain** + **QM hystereze 40–60%** + **5-color dashboard kánon** + **isProductiveTask** predikát + **ratingColor()** helper + **AUDIT:CODE/DOCS** pass. 48/48 testů zelených.)

Verze: **v3.2** (2026-04-16, sezení 25 — **Drony spotřebovávají E** + **QuarterMaster hystereze** + **Dashboard 5-color** + **isProductiveTask** + **metricColor retirement** + **workTooltip dedup**.)

Verze: **v3.1** (2026-04-16, sezení 24 — **QuarterMaster v2.3** (runtime Protokolu): auto-repair orchestrace, eternal monitor task, Task Queue Panel [T] s 5-color semaforem (eternal modrá / active oranžová / paused žlutá / pending amber / completed zelená / failed červená), radio s [E]. Task lifecycle: pending→active→paused→completed, autoclean po 1 h wall. **Responsive Layout axiom KISS** (fix panely). **Integrita** (S24). **Protocol** (S24).)

Verze: **v2.8** (2026-04-16, sezení 24 — **Integrita** + **Protocol**)

Verze: **v2.7** (2026-04-16, konec sezení 23 — **Tooltip barevný header** (TooltipContent typ, headerText objekt, 5stavový semafor). **SIGN eventy barevné** (RATING_COLOR dle cílového ratingu). **Phase retirement** (phase_a/b/c smazáno, hull breach odstraněn, Phase = boot|running). **Kvintet infotipy** (E/W/S/F/C s barevným headerem, Kapacita/Příjmy/Výdaje/Bilance). **ENERGY_MAX dynamický** (World.energyMax = Σ capacity_wh modulů). **Work model eureka** (E↔W symetrie: hráč HP=kapacita + work=výkon, dron = převodník E→WD, World.drones číslo). **Hauler retirement**. **38/38 testů zelených.**)

---

```
Voidspan
│
├── 1. PROČ hra existuje (vize, účel)                  [●]
│   ├── 1.1 Pro koho — cílový hráč                     [◐]
│   ├── 1.2 Co má hráči dát — zážitek, emoce, zkuš.    [●]
│   └── 1.3 Proč to autor dělá — Satčí osobní motivace       [●]
│
├── 2. CO hra je — designová identita                  [●]
│   ├── 2.1 Žánr / forma (text strategy, Dune II look) [●]
│   ├── 2.2 Narrative tenets (kandidáti, viz IDEAS)    [◐]
│   └── 2.3 Setting + prolog (únik ze Země)            [●]
│
├── 3. JAK se hraje — mechanika                        [◐]
│   ├── 3.1 Prostor a čas                              [●]
│   │    (WORLD/BELT/SEGMENT/MODULE/BAY, 256×16,
│   │     Energy Model W/WD, 16h den, TIME_COMPRESSION 240×,
│   │     tick 250 ms + FSM v kódu S9)
│   ├── 3.2 Postava hráče                              [◐]
│   │    (STATUS+RANK+SKILL + Capability Matrix, brains-driven)
│   ├── 3.3 Oblasti hry                                [◐]
│   │    ├── 3.3.1 Materiál & provoz (ekonomika+infra)
│   │    ├── 3.3.2 Výměna (obchod + diplomacie)
│   │    ├── 3.3.3 Řád (politika + právo/justice)
│   │    ├── 3.3.4 Společnost (skupiny 3-tier + migrace)
│   │    ├── 3.3.5 Konflikt (válka, sabotáž, rebelie)
│   │    └── 3.3.6 Vědění (věda + média + kultura/paměť)
│   └── 3.4 Protokol — AI CPU + Knowledge base          [◐] S24
│        (Bible/Ústava/Zákoník/Vyhlášky/Plány/Recepty/
│         Návody/Příručka — jeden zdroj pravdy kolonie)
│
├── 4. OBLOUKY / ARCS — čtyři game-loopy            [◐]
│   ├── 4.1 Player Arc (C) — pozvánka → exit          [●]
│   ├── 4.2 Colony Arc (B) — založení → ending        [◐]
│   ├── 4.3 Network Arc (A) — vertikální síť beltů    [◐]
│   │    (Teegarden.BeltN, Observatory Event trigger)
│   ├── 4.4 Session Arc (D) — login → logout          [●]
│   └── 4.5 Scripted events (katalog)                 [◐]
│
├── 5. META vrstva                                     [◐]
│   ├── 5.1 World Browsers (active competition view)   [◐] R1
│   ├── 5.2 Legacy Letter Archive                      [◐]
│   └── 5.3 Event log (~10M) — data pro experiment     [◐]
│
├── 6. TECHNIKA — jak to postavíme                     [◐]
│   ├── 6.1 Stack (P1: Vite+TS+Phaser; P2+: Colyseus)  [●]
│   ├── 6.2 Hosting (P1: GH Pages/Netlify; P2+: VPS)   [●]
│   ├── 6.3 Monorepo (pnpm workspace, apps/client)     [●] S8
│   ├── 6.4 Art pipeline (pipeline + paleta axiom)      [●] S11 palette + S12 magenta keying
│   └── 6.5 Moderation & LLM                           [◐]
│
└── 7. PROCES — jak pracujeme                          [●]
    ├── 7.1 Dokumentace                                [●]
    ├── 7.2 Sezení (.claude/sessions)                  [●]
    ├── 7.3 Makra (@BEGIN, @END)                       [●]
    ├── 7.4 Feedback (Kudos/Censure, 8/10)             [●]
    └── 7.5 Design principy (KISS, SLAP, DRY…)         [●]
```

---

## Bod 1 — shrnutí (uzavřeno v0.2)

### 1.1 Cílový hráč — dvoufázově
- **Primární (teď, POC):** **blízcí autora** jako playtestři P1–P4. Nekritické, ochotné, dostupné publikum pro rychlý feedback loop.
- **Sekundární (aspiračně, dlouhodobě):** teenager v sociálním kruhu — přichází na pozvání vrstevníka, hledá komunitu, baví ho sociální drama, politika, spoluvytváření světa, obrana proti sousedním koloniím.

### 1.2 Zážitek, emoce, zkušenost
**Zážitek:** peak moment je **pamatovatelný příběh**, ne score. Vzpoura → prohra → trestanecká kolonie → naděje v amnestii je stejně silný zážitek jako vítězství. Design musí odměňovat **pamatovatelné prohry**.

**Zkušenost (T4 Forgiveness rewarded, konkrétně):** hráč si chce hrát na diktátora, ale **zažije na vlastní civilizaci, že tvrdá moc kazí ekonomiku, výzkum, obranu**. Lekce je **zážitková, ne didaktická** — hra neříká „nebuď diktátor", nechá to zkusit a cítit následky.

### 1.3 Autorská motivace — tři vrstvy
1. **Koncept v šuplíku** — i nedokončený, ale rozpracovaný projekt je legitimní výstup.
2. **Učení + mentální kondice + tvorba jako zábava** — spolupráce s AI, boj proti demenci, radost z tvorby. Každé sezení má hodnotu bez ohledu na konečný stav hry.
3. **Playtesting s blízkými** — konkrétní dosažitelný úspěšný stav. Zaujmout, získat feedback, reagovat.

**„Cesta je cíl."** Žádný deadline, žádný hype cycle. **Udržitelné tempo.** Dokumentace + sessions log jsou plnohodnotný produkt.

### Poměr žánru projektu
**40 % hra / 40 % experiment / 20 % umělecké dílo.**
Experiment = rovný podíl → opravňuje event log řádu 10M **jako data pro pozorování**, ne jen atmosféru. Ospravedlňuje investici do telemetrie.

### Tři revize vynucené odpověďmi (R1–R3)
- **R1 Multi-colony pivot** — Voidspan není jeden belt proti entropii, je to **síť beltů v konkurenci**. World Browser = aktivní mapa, frakce 4.4 jsou i mezikolonijní, topologie 3.5 se rozšiřuje.
- **R2 Penal colony + amnesty** — nová mechanika, elegantně napojená na T4. Místo pro politický/násilný zločin, amnestie jako kolektivní akt odpuštění.
- **R3 Alts povoleny** — více účtů/e-mailů přípustných. Policy: integrovat jako feature (každý život = nová kapsle), ne vymáhat restrikce.

---

## Aktuální fokus

**Příští sezení (S36) — ShipRender stabilizace + stavebnice + úklid:**
- **Retire SegmentPanel** — `ship_render.ts` validated v S35, teď smazat `segment.ts` (298 LOC), `USE_PROCEDURAL_RENDER` flag (tuning.ts §11 + GameScene.ts dispatch), 8 module PNG assetů (`public/assets/modules/*.png`), preload `AVAILABLE_MODULE_ASSETS` blok. Net −~400 LOC.
- **Stavebnice 1×N / 2×N rozhodnout** — IDEAS návrh: SolarArray 1×3, CommandPost 2×2, MedCore 1×2, Habitat 1×2 (nebo 2×1). Engine 2×2 už existuje. Update `MODULE_DEFS.w/h` v `model.ts`, fallback v `createInitialWorld` `BODY_IDXS`. Počet bays (8×2 = 16) vs. počet modulů (8 kusů) — potřeba zkontrolovat fit po zvětšení.
- **`findActiveTaskForModule` extract** do `world/task.ts` — ModulesPanel má podobný `tasks.find` pattern (rule-of-two), konsumovat v `ship_render.ts` (nahradit inline Set builder) + `modules_panel.ts`.
- **Sanity playtest** — repair animace (outline pulse), damage fill (HP % zleva), offline checker, Tabler glyphy, rating barvy napříč HP spektrem (start má 1 critical damage, uvidíš rate-1/rate-2).

**Další bagr po S36 (R2 Player Awakening prep):**
- Wake-up mechanismus, Player HP ekonomika, Commands palette, Scripted capsule drops, damage particles burst (S35 follow-up v TODO).

**S35 hotovo (Neon paleta + ShipRender + Tabler ikony + semafor barva modulů):**
- **Paleta přepsána na Neon** v `palette.ts` — 5 rating tónů výbojkové rodiny, cyan retired z rating (zachován pro Storage/Fluids kanon), AMBER saturovanější, VOID_BLACK hlubší. Canvas BG `#000000`.
- **Nová §1b KIND_\* konstanty** (8 per-modul identity hue) pro budoucí decorative use case. Z palette-preview §2.
- **`ratingColorNum(pct)` + `RATING_COL`** — number paralela existujícího HEX mappingu pro Phaser fillStyle/setTint.
- **`palette-preview.html`** nová reference stránka. Původní `style-guide.html` zachován jako archiv.
- **ShipRender** (`apps/client/src/game/ui/ship_render.ts`, 433 LOC) — procedural BELT renderer (Phaser.Graphics outline + fill + Tabler SVG glyph + asteroid flash + selection). Sdílí public API se SegmentPanelem, dispatch přes `USE_PROCEDURAL_RENDER` flag.
- **9 Tabler SVG ikon** (MIT) preloaded jako Phaser.Image, tint = `ratingColorNum(hpPct)` (semafor izomorfismus s ModulesPanelem). Mapping Habitat=home, Solar=solar-panel, Storage=package, Assembler=hammer, Dock=anchor, Engine=engine, MedCore=first-aid-kit, Command=broadcast, fallback=cube.
- **Status modulace:** online solid, damaged dashed outline + HP fill zleva, offline grey + checker, building dotted + progress fill. Void = dashed grey + „+" procedural.
- **Active task pulse** — outline alpha yoyo sin 0.5..1, perioda 2 s, fill static (skutečné HP%). Směr (ascending/descending) se vizuálně neliší, detail v tooltip.
- **/simplify pass** — activeTaskModuleIds Set preflight (O(tasks) scan 1×/frame), pulse phase hoist, drawDashedLine closure → private method, Math.hypot → axis-aligned abs sum, flag komentář konsistence.
- 101/101 testů zelených, TS strict clean.

**S34 hotovo (Art pipeline cesta C rollback + AI arena brief + Gemini mix):**
- **Cesta C integrační test selhal** — hires pipeline `scripts/build-assets-hires.py` (Python Pillow chroma-key bez downscale) + segment.ts refactor (16 hull sprites, uniform contain scale, deterministická rotace, feature flag `USE_HULL_OVERLAY`). User vizuální test: „Tohle nefunguje, rollback."
- **Rollback přes `git checkout`** — staré 40×40 pixel art zpět. Code untouched.
- **Pivot na AI arena** — `art/arena_brief.md` self-contained prompt pro arena.ai, 3 zóny (header/ship/bottom), modulární stavebnice, anti-vzory (NASA/Chris Foss/generic sci-fi), styl jen doporučení.
- **Arena 2 Gemini iterace** — v1 hologram dashboard + v2 blueprint klid. User verdict: **mix v1 + v2** (v2 base + v1 action efekty). Uloženo `art/arena_winners/gemini_1.png` + `gemini_2.png`.
- **IDEAS 2 nové sekce** — Art pipeline pivot (diagnóza, retire list) + Style extraction (paleta per modul kind, status izomorfismus, implementation outline pro S35). LOC cíl ≤500, žádné PNG.
- **Úklid** — retire `pokus1.md`, `pokus2/` (8 souborů), `pokus3/`, `build-assets-hires.py`, package.json alias. Settings konsolidace (+ `python:*`).
- **Technická lekce** — `pnpm build:assets` je 40×40 pixel art pipeline (downscale 36×36), mix s hires nemožný bez bypass.
- 101/101 testů zelených, TS strict clean.

**S33 hotovo (v0.9 + dvojitý audit + Mission Scenario + Narrative voice + Art pipeline pivot):**
- **v0.8 → v0.9 bump** — package.json root + client, PLAYTEST_GUIDE.
- **QM Terminal `buildTerminalBody(w)`** — runtime placeholders {E/W/S/F} + `[Nestabilní!!!]` ASCII tag + SEED_CREW_CRYO/SEGMENT_ADDRESS konstanty.
- **Modal SIDEPANEL font (18 px)** — sjednoceno s I/M/E/T panely. Help + Terminal hustší.
- **Blikající kurzor v modalu** — `cursor?: boolean` option, Rectangle geom, tween yoyo 500 ms, named constants, edge case guardy.
- **Mission Scenario v0.1** v `IDEAS.md` — 7-aktový oblouk od Tranzit po Belt Closure, autorské beats.
- **Narrative voice axiomy + E1-E8 sandbox** v `IDEAS.md` — 6 axiomů hlasu + Before/After existujících event textů + 8 tón-first povídek.
- **@AUDIT:CODE + @AUDIT:DOCS** — `audit/audit_260418_*.md`. Vyřešeno: SPECIFICATION §4.5 Slab/Flux/Kredo retire, GLOSSARY II.1 food/air/water retire, PLAYTEST_GUIDE skeleton/REPR retire + [Q] panel, POC_P1 refs napříč 14 soubory cleanup, palette stale „LOSS" komentář, terminal magic strings.
- **/simplify pass** — REAL BUG: tween leak v `ModalManager.close()` fix (`killTweensOf` před destroy). + `COL_AMBER_BRIGHT` direct místo HexStringToColor + named cursor constants + edge case guardy.
- **Art pipeline pivot** — opuštění 40×40 + 16-color: pokus 1 (tile sheet) selhal → pokus 2 (per-modul, 8 prompts) → odhalil layout problém (ISS-style vs. compartment-style) → cesta C zvolena (hull base + module overlay 75 %) → pokus 3 hull tile generated. Habitat + hull tile assety hotové, 7 modulů + integrace zítra (S34).
- 101/101 testů zelených, TS strict clean. Memory `feedback_single_process_machine.md`.

**S32 hotovo (@AUDIT:CODE + 7 dluhů + FloatingPanel + QM Query terminal + M-110 DSO):**
- **@AUDIT:CODE** `audit/audit_260417_code.md` — scorecard vs. S28, 13/13 axiomů, test coverage 16.5 %.
- **7 dluhů vyřešeno** — F1 stale komentáře, F3 iconText, F4 `Record<EventSeverity>`, F5 `SEED_DRONES`, F6 `appendEventLog` retire, F2+F7 base class.
- **`FloatingPanel` base class** — 4 panely migrovány, −442 LOC, net −234. EventLog max klesl z #1 (507) na #3 (380).
- **POC_P1.md smazán** — historický artefakt, retire.
- **Kurzor ruky globální** — `tooltip.updateCursor(hasTooltip)` dynamicky per `provider()` result.
- **QM Terminal** — [Q]uery command, auto-open, LS flag, suchý tech tón. Welcome retire.
- **M-110 DSO** — KISS redukce z M-31 kompozice na samotnou eliptickou satelitku.
- 101/101 testů, TS strict, dev server HMR.

**S31 hotovo (UX polish + EventVerb redukce + DSL/AI Terminal IDEAS + v0.8):**
- **EventVerb 25 → 9** — retire nepoužívaných (SPWN, ARRV, DPRT, REPR, BLD, DEMO, PROD, HAUL, FAIL, IDLE, WAKE, DOCK, TICK, EVNT, SAY, RPRT). Data-driven pravda: co v typu = co lze vidět. GLOSSARY katalog přepsán (9 aktivních + 16 retirovaných s návratovým triggerem R2/P2+).
- **InfoPanel** — 3. řádek Drony (working/idle/offline izomorfní s Posádka cryo/alive/dead). Hierarchický formát kapitola + odsazená podkapitola (izomorfismus s E/W/S/F tooltipy).
- **ModulesPanel** — 5-sloupcová tabulka: `Kind (id) status HP% task_state`. Rating header zachován, 3 řádky agregátů retire. Zebra stripes added → zjemněno → úplně pryč. **5-color semafor per řádek** (RATING_COLOR dle hpPct, izomorfismus „ukazatel a barva sdílí metriku"). `moduleStatusCs` porovnává displayed int (fix „poškozeno 100%" floating-point artefaktu).
- **S/F tooltip** — `currentDayRate()` fallback: partial bucket × (DAY/elapsed) = extrapolovaný rate, když `flow.filled === 0`. User vidí drain okamžitě, ne po 4 min wall.
- **EventLog chip sync** — `syncSeenVerbs()` v constructor + toggle() před renderRows. SYST chip vzniká ve stejné milisekundě jako SYST řádek, bez 1-frame delay.
- **v0.7 → v0.8** (package.json root+client, PLAYTEST_GUIDE.md).
- **IDEAS** — Protocol DSL + QM Communication Terminal sekce zapsány. Oponentura k AI terminalu: T2 violation, LLM fatigue, persona drift, prompt injection, multiplayer misconception, overthinking. Hybrid path A (template)→B (AI overlay, propose)→C (AI writer)→D (full AI).
- 101/101 testů (beze změny), TS strict čistý.

**S30 hotovo (lazy filters + 2×2 layout + asteroid + M-42 + cryo failure + recipe totals):**
- **Lazy filter chips** v EventLogu — per-verb on/off (abecední wrap, LS persist, default all ON, chip font 9 px bez underline). „Další bagr" #10 ✅
- **Bottom Bar** `[I]info` → `[I]nfo` (úspora 5 znaků, 5 tlačítek).
- **Ellipsize v row panelech** — `ellipsizeText` helper (binary search, `…` single char). ModulesPanel single blob → per-row pair (kindIdText fix column 220 + statsText). TaskQueue lead + suffix **dynamic right-aligned** (suffix.x = PANEL_W − PADDING − suffix.width). Middle-column ellipsis jen názvu, ne statusbaru.
- **Tooltip na ořezaných řádcích** — `fullRowData[]` paralelní, `attachTooltips()` v E, T, M; tooltip provider vrací null pokud nebyl ořez.
- **Asteroid system (návrat S28 retire)** — `scheduledEvents` slot 9 aktivní. 1× / 10 h wall, 5–20 % hp_max, red flash 600 ms. `Module.flashUntilTick` + segment overlay. Plošný decay 150× pomalejší (0.0000667). Žádné kapsle (user rozhodnutí).
- **M-42 Orion Nebula** — 7 SVG parts (3 wisps retired po user feedbacku) v `public/assets/dso/m42/`, fixed world pos `(220, 180)`, scale 0.55, BlendModes.ADD/NORMAL. Random DSO retirován.
- **Pevné 2×2 layout** — mutex I↔M + E↔T zrušen, `PANEL_HALF_H = 367` (+30 %), `PANEL_WIDTH_STD = 460`. I vlevo nahoře, M vlevo dole, E vpravo nahoře, T vpravo dole.
- **Cryo failure (slot 6 actorLifeTick)** — všechny MedCore HP=0 → 32× DEAD s hromadným event. Endgame spirála: S/F dojdou → QM stop → asteroid zničí MedCore → 32 mrtvol. „Kus šrotu bez života, doslova."
- **Help modal 2-col** — `ModalOptions.bodyLeft/bodyRight`, PANEL_W 520 → 720.
- **Footers retire** — EventLog (count + 📋 Copy button) + TaskQueue (count).
- **BOOT → SYST** (po Censure! k 3-char SYS). Memory `feedback_convention_audit.md`.
- **cost_coin retire** (zavádějící ve FVP); **recipe** v katalogu přepsán na **TOTAL** hodnoty (Engine 211 S + 62 F atd.), `getTaskRecipe` runtime převod na per-HP.
- 101/101 testů zelených.

**S29 hotovo (font swap + čitelnost + Welcome reset):**
- **Font VT323 → Atkinson Hyperlegible** — sans navržený Braille Institutem pro max čitelnost. Fallback kandidát `IBM Plex Mono`, kdyby proporcionální font rozbil tabulkové layouty. Preload 7 velikostí (16/18/20/22/28/36/48 px) v `main.ts` před `new Phaser.Game`.
- **Globální bump -2 px** — sans má větší x-height, menší velikost zůstává čitelná. Hierarchie CHROME 22 / PANEL 20 / TIP 18.
- **Nová `FONT_SIZE_SIDEPANEL = 18px`** — I/M/E/T panely mají extra -2 px oproti modalu/welcome/ActorsPanel/commandButton (PANEL=20). Vyšší hustota dat v bočních panelech opravňuje menší velikost.
- **Welcome reset cesta** — Help [H] → tlačítko „Zobrazit uvítání" (vlevo od Close). Modal API rozšířeno o `action?: { label, onClick }`. `resetWelcome()` mazač LS flagu. Přínosné pro playtestery P1–P4.
- **DSO 1/8** — `DSO_CHANCE` 0.35 → 0.044. Mlhoviny jsou teď vzácné výjevy, ne 1/3 chunks.
- **Font preview tooling** — `public/font-preview.html` s 7 kandidáty × 3 velikosti × CS pangram + čísla/diakritika/UI sample. Opakovaně použitelné pro příští font rozhodnutí.
- **Stroj swap hejna → mrkla** — discard lokálního WIP palette.ts, pull 5 commitů (S25-S28). CLAUDE.md `@BEGIN` rozšířen o krok 2 (MEMORY.md) + krok 7 (pnpm dev na pozadí).

**S28 hotovo (audit + cleanups + retire + dokovací MVP):**
- **@AUDIT:CODE** (`audit/audit_260416_code.md`) — první od 04-13. 4 z 5 starých dluhů vyřešeno; identifikováno 6 nových (F1-F6).
- **F1 — `world.ts` extrakce** (1166 LOC → 14 souborů v `world/`). API zachováno přes re-exporty v `index.ts`. Max soubor 195 LOC, SLAP obnoven.
- **F4 — `InteractiveGameObject` type** v tooltip.ts (cast `as unknown as` retired).
- **F6 — `UI_MASK_WHITE`** konstanta v palette.ts (3× hardcoded `0xffffff` v mask graphics nahrazen).
- **F5 — globální ESC handler** — priority chain v GameScene: modal → welcome → modules → info → task → event. Lokální ESC listenery v modal/welcome odstraněny.
- **F2 — lightweight DRY** (`ui/panel_helpers.ts`) — sdílené konstanty + LS pref helpery pro 4 panely. Full base class odložen na 5. panel.
- **F3 — logic-only smoke testy** — `panel_helpers` + `world/{format,flow,bay}` testy. 53 → 88 testů.
- **Asteroid system retire** — `orbit.ts` (159 LOC) smazán. PNG ponechán, IDEAS sekce s plánem návratu (P2+ s damage mechanikou).
- **Drift magnitude** 7 → 30 px (4× silnější). **Damage** 3 fixed → 1 critical (`START_DAMAGE_HP_RATIO`).
- **Layered bay axiom retire** — `Bay` union zúžen na `void | module_root | module_ref`. Smazáno: `CoverVariant`, `BayDef`, `BAY_DEFS`, `SKELETON_HP_MAX`, `COVERED_HP_MAX`. Dead `ui/side_right.ts` smazán. IDEAS sekce „Layered bay axiom (retired S28)".
- **Loď kompaktní** — `createInitialWorld` přepsán: 8 modulů (Hab + 2× Sol + Med + Ass + CP + 2× Sto) přilepených k motoru v `BODY_IDXS = [2,3,4,5,10,11,12,13]`. 4 void bays vlevo (cols 0-1).
- **⊙ Brand ikona** vrácena přes `BrandIcon` (Phaser Graphics, kruh + tečka). Nezávislá na fontu, ruší S27 ASCII fallback `O`.
- **Bottom Bar** — mezery mezi `[X]` a popisem odebrány: `[I]info [M]modules [E]events [T]tasks [H]help`.
- **Font 3-level konsolidace** — 11 konstant → 3:
  - **`FONT_SIZE_CHROME` 24 px** — Top Bar, Bottom Bar
  - **`FONT_SIZE_PANEL` 22 px** — všechny 4 panely (header + content), modal, welcome, commandButton
  - **`FONT_SIZE_TIP` 20 px** — tooltipy + footer/btn/hint texty
- **`T:` prefix split** — `formatGameTime` (Top Bar, kontextuální tag) vs `formatGameTimeShort` (Event Log, Task Queue — čistý čas).
- **ModulesPanel UX** — repair progress branch retire (patří do [T]). Přidán „Stav modulů" 5color rating header (`statusRating(w.status.base.pct)`).
- **Dokovací systém MVP** — `DockManager` singleton (77 LOC) + `setSegmentX` setter. BELT re-centruje do volné zóny mezi otevřenými panely. Mutex pairs zachovány. ~108 LOC celkem.

**S27 hotovo (font glyph fallback fix — „Další bagr" #12 ✅):**
- Diagnóza: Google Fonts CSS `latin` subset pro VT323 doručuje `unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, ..., U+2191, U+2193, U+2212` — geometric/dingbats/exotické arrows mimo → browser fallback na monospace rozbíjel baseline.
- KISS ASCII substituce napříč rendered code (žádný switch fontu, žádný self-host):
  - `events.ts` VERB_CATALOG (24 entries): ◉→`*`, †→`x`, ✓→`+`, ▲→`+`, ▽→`v`, ↘→`\`, →→`>`, ✓✓→`OK`, ☆→`~`, ⊙→`()`, ⚑→`>>`, ◆→`<>`, ◈→`#`
  - `header.ts` E/W/S/F tooltipy: ▤▲▼Σ ☻¤ ✓ DROPnuté (label nese význam), `→/←/∅`→`>/</avg`, brand `⊙`→`O`
  - `modules_panel.ts` statusIcon: ●○▯▼✕→`o _ ^ v X`
  - `task_queue.ts`: ✓→`OK`, ✕→`X FAILED`
  - close buttony napříč: `✕`→`X`
  - `welcome.ts` OBSERVER_ID `OBS-∷-042`→`OBS-··-042`
  - `GameScene.ts` help modal „Co sleduješ" sekce: ikony nahrazeny textovými labely
  - `world.ts` SIGN event text `→`→`>`
- Zachováno: `↑↓ × » · −` (latin subset / Latin-1)
- 53/53 testů zelených, TS strict čistý

**S26 hotovo (release-ready FVP Observer Edition v0.7):**
- **FVP KISS resources** — ploché Solids/Fluids/Coins (subtypy metal/components/water/coolant → P2+ `Resource subtypes` TODO)
- **Rolling-window KPI** — `FlowHistory` ring per game day, `FLOW_WINDOW_GAME_DAYS = 10`, S/F tooltipy mají Kapacita/Příjmy/Výdaje/Bilance/Runway (slovní: naplní/vyprázdní za X game-day / stabilní / vyčerpáno / naplněno)
- **Coin** = žlutá placeholder, tooltip odstraněn (FVP = nespotřebovává/nedoplňuje se)
- **32 cryo crew** — `SEED_CREW_CRYO = 32`, vazba na MedCore 32 cryolůžek, player + colonist_01..31
- **ModulesPanel [M]** — nový panel vlevo, mutex s [I]; per-module status/HP/power/capacity + active task progress bar; hotkey M, LS persist
- **InfoPanel redukce** — jen Posádka + Základna (Zásoby/Energie/HP avg → Top Bar infotipy)
- **VT323 font** (Google Fonts OFL, CS-complete) + **+2 px scale bump** napříč, `FONT_SIZE_TOOLTIP` samostatná konstanta
- **Observer Edition** — welcome text přepracován (Pozorovateli / 32 cryo / Teegarden's Star / cílová orbita / teaser probuzení bez CTA), help plně CZ, PLAYTEST_GUIDE.md v rootu, v0.7 bump
- **Build ID** — Vite define `__BUILD_ID__ = Date.now().toString(36)` v Top Bar identity tooltipu (sanity check pro user, že načetl aktuální verzi)

**S25 hotovo (velký refaktor):** Drone E drain (productionTick: `netPower - droneDraw - softwareDraw`). QuarterMaster hystereze 40–60% (RESUME 3 → 4). Dashboard 5-color kánon (`ratingColor(pct)` helper, `metricColor` retirement). `isProductiveTask(t)` sdílený predikát. workTooltip dedup. **Software třída** + příkon (QM v2.3 = 0.86 W; E=0 → SW offline + DRN:CRIT). **Repair recipes** (M:N reference Modul/Bay → Solids/Fluids subtypy; per-HP rate; gate na deficitu kterékoli složky s důvodem `no <subtype>`). **E infotip** moduly agregované per kind. **Kvintet rename**: Pevné/Solids (S), Tekutiny/Fluids (F) — `Slab`/`Flux` retirováno z displaye i kódu. **Resource Taxonomy** (rarity Common→Epic + logistics matrix Solids/Fluids — P2+ design baseline). **Food + Air retire (KISS)**: `solids.food` (atribut, ne kategorie) + `fluids.air` (24th-cent recyklace) odstraněny. FVP subtypy: Solids = {metal, components}, Fluids = {water, coolant}. Top Bar S/F bary = worst-of subtypů. **Memory** `feedback_lang_convention.md` (code EN, display CZ). **AUDIT:CODE + AUDIT:DOCS** pass.

**S24 hotovo:** Integrita (II.2, `entropy` → `integrity`, E vyjmuta). Protocol (GLOSSARY — AI CPU + knowledge base). Responsive Layout (KISS — fix panely, canvas = viewport, 2D pozadí). CLAUDE.md Design principy sekce. **QuarterMaster v2.3** (autopilot: E gate + kapacitní check, min-HP target, eternal monitor, cleanupOldTasks 1 h). Task lifecycle (pending/active/paused/completed/failed/eternal). Task Queue Panel [T] (5-color semafor, radio s [E]). TASK event verb (◈). Progress bar `███░░░░░░░`. W rating = availability (Censure fix — semafor sdílí metriku s ukazatelem). Bay tooltip stav tasku místo klik.

**S23 hotovo:** Tooltip barevný header. SIGN eventy barevné. Phase retirement. Kvintet infotipy. ENERGY_MAX dynamický. Work model eureka. Hauler retirement.

**S22 hotovo:** Mobile touch. Event format CZ. InfoPanel UX. Energy infotip.

**Další bagr (Release 2 — Player Awakening Edition):**
1. **Wake-up mechanismus** — probuzení prvního kolonisty (welcome CTA „Probudit"), cryo → idle → working lifecycle. Bez něj observer sim stagnuje.
2. **Player HP ekonomika** — working aktér drainuje HP per tick; recovery via rest/idle; game over při HP=0.
3. **Commands palette** — `[B]uild [R]epair [D]emolish` v Bottom Baru + hotkeys; klik na bay v Player mode → akce (repair infra už existuje).
4. **Scripted capsule drops** — každých 2-3 game days ARRV event s +S/+F/+Coin, narativní text (opačný pól bilance S/F).
5. **Energy=0 → cryo failure trigger** — E=0 → WAKE random 3 → homeless HP drain → DEAD cascade (SW offline už máme).
6. **Observer/Player mode switch** — indikátor v Top Baru, hotkey toggle nebo irreversible welcome.
7. **Research ladder** — QM upgrade v2.3 → v2.4 unlock capability; unlock module kinds.
8. ~~**Inteligentní postranní dokování panelů**~~ ✅ S28 — DockManager MVP. BELT axiom „panel ustupuje, ne BELT" implementován. P2+ rozšíření: auto-side decision, vertikální stack, tween animace.
9. **II.2 Integrita jako rate** — přepis snapshot → Δ HP / game day (repair vs. decay).
10. ~~**Lazy filter chips**~~ ✅ S30 — per-verb abecední wrap, LS persist, default all ON.
11. **Module FX animations** — blink/fan/dish/sparks. Data-driven (`ModuleDef.fx?`) nebo shader pipeline.
12. ~~**Font glyph fallback fix**~~ ✅ S27 — KISS ASCII substituce napříč rendered code (events.ts VERB_CATALOG, header.ts tooltipy, modules statusIcon, close buttons, OBSERVER_ID, help modal, SIGN texty). Latin-1/latin subset bezpečné chars zachovány. P2+ alternativa (pokud bude vůle): self-host VT323 TTF s `unicode-range: U+0000-FFFF` v `@font-face` — vrátí všechny původní glyphy.

**Terminologie prototypů:** P1/P2/P3/P4 = **POC** (proof of concept), ne MVP. Cíl = dialog s blízkými, ne trh.

**Terminologie entit:** WORLD → BELT → SEGMENT → MODULE → BAY. Pojem „Cell" retirován. SHIP-Bow/Stern retirován (S6).
