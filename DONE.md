# DONE.md — ⊙ Voidspan

Hotové úkoly. Přesouvá se z `TODO.md`.

## 2026-04-16 (Sezení 25 — Drone E + Recipes + Solids/Fluids + Resource Taxonomy + Food/Air retire)

- [x] **Drone E drain v productionTick** — `delta = (netPower - droneDraw - softwareDraw) / ticksPerHour`. Symetrie E↔W (S23 work eureka) konečně sim-implementována. Cyklus: drone-on → E drop → drone-off → E rise.
- [x] **QuarterMaster hystereze 40–60%** — `PROTOCOL_RESUME_RATING` 3 → 4. Pause E < 40% (rating ≤ 2), resume E ≥ 60% (rating ≥ 4), amber pásmo drží stav. Zabrání flappingu.
- [x] **Dashboard 5-color kánon** — Top Bar bary `ratingColor(pct)` místo `metricColor` (3-color). Sjednocené s tooltip headery. `metricColor` smazán jako dead code.
- [x] **`isProductiveTask(t)` predikát v model.ts** — sdílený filter `status === "active" && kind !== "service"` napříč productionTick / computeWork / energyTooltip / workTooltip.
- [x] **`ratingColor(pct)` helper v palette.ts** — wrap přes `RATING_COLOR[statusRating(pct)]`. RATING_COLOR type tighten na `Record<StatusRating, string>` (žádné `!` non-null asserce).
- [x] **workTooltip dedup** — `totalPlayerW` accumulated v expense loop, druhý 6-řádkový iter smazán. Sdílená drone řádka (1× w.drones), ne per task.
- [x] **Software třída** — `Software = { id, name, version, draw_w, status }` v model.ts; `World.software: Record<string, Software>` (nahradilo redundantní `World.protocolVersion`). QuarterMaster v2.3 s `draw_w = 0.86 W` v tuning.
- [x] **SW E gate + recovery** — productionTick odečítá `Σ draw_w` běžících SW; E=0 → SW offline + DRN:CRIT + monitor label „OFFLINE — no power" + protocolTick force-pause; E > 0 → SW boot + BOOT event. State-based sync (robust při damage scénářích).
- [x] **Repair recipes (M:N reference)** — `ResourceRecipe` typ v model.ts, `BAY_DEFS` pro skeleton/covered, `recipe: ResourceRecipe` per modul (per-HP rate, sparse subtypy). Recipe helpers (`getTaskRecipe`, `whichResourceMissing`, `consumeResources`, `firstMissingRecipeSubtype`). progressTasks drénuje per recipe; protocolTick gate na deficitu kterékoli složky s důvodem `no <subtype>`.
- [x] **E infotip agregace per kind** — moduly sloučené v energyTooltip (ID odpadlo, HP průměr, count v suffixu `×N`).
- [x] **Slab/Flux → Pevné/Solids, Tekutiny/Fluids** — kvintet rename v GLOSSARY + bulk rename v kódu (`World.resources.slab → solids`, `flux → fluids`, `slabTooltip → solidsTooltip`, `fluxTooltip → fluidsTooltip`). Skupenstvová paralela (oba plurály neutra).
- [x] **Resource Taxonomy v GLOSSARY** (P2+ design baseline) — rarity 5 stupňů (Common → Epic) + logistics matrix (doprava/skladování/metrika per Solids/Fluids). 8 P2+ TODO zapsáno.
- [x] **Food + Air retire (KISS)** — `solids.food` (food je atribut item, ne kategorie) a `fluids.air` (24th-cent recyklace) odstraněny z modelu. FVP subtypy: Solids = {metal, components}, Fluids = {water, coolant}. resourceDrain + actorLifeTick → no-op stuby. Top Bar S/F bary = worst-of subtypů.
- [x] **Memory `feedback_lang_convention.md`** — code EN, display CZ, target EN.
- [x] **AUDIT:CODE pass** (3 paralelní agenti) — `isProductiveTask`, `ratingColor`, `RATING_COLOR` typing, workTooltip dedup, sprint-tag noise vyčištěno.
- [x] **AUDIT:DOCS pass** — GLOSSARY QM gate (W rating + RESUME 3 stale), 5-color sjednoceno, MINDMAP v3.2.

## 2026-04-16 (Sezení 24 — Integrita + Protocol + Responsive Layout + QuarterMaster)

- [x] **Integrita (II.2)** — `entropy` → `integrity` v kódu, E vyjmuta z výpočtu (jen hpAvgPct), label „Integrita". TODO rate do budoucna.
- [x] **Protocol (GLOSSARY)** — nová sekce, 8 vrstev knowledge base, 8 otevřených Q, uzel 3.4 v MINDMAP.
- [x] **Responsive Layout (KISS)** — `Phaser.Scale.RESIZE`, fix velikosti panelů, canvas = viewport, 2D chunk pozadí, relayout jen kde se něco mění.
- [x] **Design principy sekce do CLAUDE.md** — KISS / DRY / SLAP / izomorfismus / foundations-before-curtains autoloaduje se do sezení.
- [x] **QuarterMaster v2.3** — autopilot kolonie: E gate, kapacitní check, min-HP target selection, eternal monitor task, cleanupOldTasks (1 h wall autoclean).
- [x] **Task lifecycle** — pending / active / paused / completed / failed / eternal; `createdAt`, `completedAt`; TaskKind += service.
- [x] **Task Queue Panel [T]** — 5-color semafor, sekce Eternal/Active/Paused/Pending/Completed/Failed, radio mutex s [E], bottom bar button.
- [x] **TASK event verb (◈)** — START/PAUSE/RESUME/FAIL emity v protocolTick.
- [x] **Progress bar `███░░░░░░░`** — block full/empty bez závorek.
- [x] **W rating = availability** (Censure fix) — semafor sdílí metriku s ukazatelem 0/23. Protocol gate přesunut z W rating na kapacitní check.
- [x] **Bay tooltip** — „Probíhá oprava (30%)" místo „Klik = enqueue" v Observer módu.
- [x] **Floating panels internal geometry** (S24) — EventLog + InfoPanel relayout (redukováno na KISS → container.setPosition stačí).

## 2026-04-16 (Sezení 23 — Kvintet infotipy + Phase retirement + Work model)

- [x] **Tooltip barevný header** — `TooltipContent` typ, `headerText` objekt, 5stavový semafor v tooltipech.
- [x] **SIGN eventy barevné** — Event Log řádky SIGN verb barvené dle cílového ratingu.
- [x] **RATING_COLOR sdílený** — přesunut z info_panel do palette.ts.
- [x] **Phase retirement** — phase_a/b/c smazáno, startGame/repairDone/dockComplete/phaseLabel smazáno, hull breach odstraněn.
- [x] **ENERGY_MAX dynamický** — World.energyMax = Σ capacity_wh × HP/HP_MAX online modulů. ModuleDef.capacity_wh optional.
- [x] **Kvintet infotipy** — E/W/S/F/C s barevným headerem, strukturou Kapacita/Příjmy/Výdaje/Bilance.
- [x] **Hauler retirement** — ActorKind = jen player, TASK_DEFS.haul smazán.
- [x] **Drony = číslo** — World.drones = 23, žádná Actor entita, převodník E→WD.
- [x] **Work model** — Actor.work = výkon (W), HP = kapacita (Wh), dvě osy v computeWork.
- [x] **InfoPanel zjednodušení** — sekce Úkoly a Události odstraněny.

## 2026-04-15 (Sezení 22 — Mobile touch + Event format + InfoPanel UX + Energy infotip)

- [x] **Touch ovládání** — bottom bar touch buttony [I][E][H], touch drag scroll EventLog, viewport meta, orientationchange handler.
- [x] **Environment detection** — header tooltip: hostname → local/GitHub Pages/custom.
- [x] **Event texty české věty** — `formatEventRow` preferuje `text` pole, všechny appendEvent s CZ textem.
- [x] **SIGN supplies → driver resource** — `Air ↓ Dostačující → Slabá (40%)` místo abstraktního „Zásoby".
- [x] **Severity izomorfismus** — warn orange (#ff8020), 4 vizuálně odlišné barvy.
- [x] **InfoPanel pyramida** — řazení I→II→zbytek, Unicode ikony dvousloupcový layout, scroll system.
- [x] **Icon test + rozhodnutí** — Unicode 18px. Sada: ☻⌂≡↯▲◆.
- [x] **IV. Společnost** — přejmenování z Společenský kapitál.
- [x] **Energy infotip** — Top Bar E: stav+rating, příjmy/výdaje s ořezem, bilance.
- [x] **Tooltip responzivní šířka** — bez fixního MAX_WIDTH.
- [x] **Oba panely 18px font** — InfoPanel + EventLogPanel body text.

## 2026-04-15 (Sezení 21 — Event Log + Perpetual Observer + Pyramida vitality)

- [x] **Event Log datový model** — `Event`, `EventVerb` (24+SIGN), `EventCsq`, `EventSeverity` v `model.ts`. `World.events: Event[]`.
- [x] **Verb katalog + severity lookup** — `events.ts` s `VERB_CATALOG`, `severity()`, `appendEvent()`.
- [x] **Ring buffer push** — `appendEvent()` + `EVENT_LOG_CAPACITY = 500` v `tuning.ts`.
- [x] **Pipeline napojení** — BOOT, CMPL, ASSN, DRN:CRIT, DECY:CRIT, DEAD, SIGN emity na klíčových místech.
- [x] **EventLogPanel UI** — `event_log.ts`, [E] toggle, scroll, severity color, copy 📋, localStorage.
- [x] **Hotkey `[E]` toggle** — case-insensitive v `GameScene.bindDebugKeys`.
- [x] **Auto-scroll** — bottom lock, manuální scroll pauzuje, scroll dolů = resume.
- [x] **Font axiom** — Jersey 25, `FONT_SIZE_HINT` 16px pro event log řádky.
- [x] **Commands hint** — `FONT_SIZE_CMD` = 18px, Bottom Bar aktualizován.
- [x] **Phase win/loss retirement** — odstraněno z `Phase`, `LossReason`, `toLoss`, `endDay`. Testy přepsány.
- [x] **Actor HP + cryo + dead** — `Actor.state` += `"cryo"`, `hp`, `hp_max`. `actorLifeTick` drain. Posádka v kryu.
- [x] **Energy model** — `productionTick` s HP ratio axiomem. Moduly startují online.
- [x] **Decay model** — `decayTick` 1% hp_max/game day. HP=0 → offline + DECY:CRIT.
- [x] **Status tree pyramida vitality** — I×8 + II×4 + III×2 + IV×1 / 15. `recomputeStatus` naplněn.
- [x] **SIGN verb** — ⚑ event při změně ratingu na libovolné ose (nahrazuje STAT).
- [x] **InfoPanel [I]** — `info_panel.ts`, rating barvený (5 barev z palety), tooltip pyramida, live refresh.
- [x] **Tooltip z-order** — depth 1000 → 1800.
- [x] **Sdílená memory přes git** — `.claude/memory/` s 9 feedback soubory.
- [x] **GLOSSARY** — tabulka 5 úrovní hodnocení stavu pásu.

## 2026-04-15 (Sezení 17 — Paleta 16→15→16, GH Pages live, multi-tile render, AI art pipeline, mateřská loď osazena)

- [x] **Palette: sloučení void-black** — `#080808` → `#0a0a10` (UI_BG/UI_PANEL_BG přesměrovány).
- [x] **Palette: cyan akcent** — `#40c0c0` coolant-cyan přidán na slot 13.
- [x] **GitHub Pages deploy workflow** — `.github/workflows/deploy.yml`, artifact-based, auto-deploy on push main.
- [x] **Repo public** — pro free tier GH Pages.
- [x] **Live URL P1–P4** — https://mrklas69.github.io/Voidspan/
- [x] **Multi-tile sprite rendering (S17b)** — `SegmentPanel.drawTileSprite(idx, key, spanW, spanH)`, root/ref detekce přes rootOffset.
- [x] **AI art pipeline** — `scripts/process-art.ps1` wrapper, `key-transparency.ps1` tolerance + custom KeyR/G/B.
- [x] **8 sprite kitů clean** — kit-01 až kit-08 v `temp/`.
- [x] **Art prompts reorganizace** — `art/prompts/` 4 prompty + README s axiomy a katalogem.
- [x] **V4 chroma-key enforcement** — explicit pravidlo v každém promptu proti pink-magenta cheatování.
- [x] **Mateřská loď plně osazena** — 8 reálných assetů (habitat/storage/medcore/assembler/command_post/dock/engine/solar_array), všechny whitelisted.
- [x] **v0.6 bump** — root + apps/client package.json.

## 2026-04-15 (Sezení 20 — @AUDIT cleanup + Simulation axioms + EventLog spec)

### Audit kód + docs
- [x] **Paleta: overlay/trajectory konstanty** — `UI_OVERLAY_BLACK`, `UI_TRAJ_STATIC/RISING/FALLING` sémantické aliasy; odstraněny ad-hoc `0x000000` / `0xff8800` / `0x00ff00` / `0xff0000` z `segment.ts`, `modal.ts`, `welcome.ts` (uzavírá S18 Censure regression riziko).
- [x] **`apps/client/src/game/tuning.ts`** — centrální zdroj laditelných parametrů (TICK_MS, HP_MAX, WD_PER_HP, seedy resources, wear + damages, energy). `world.ts` importuje + re-exportuje pro zpětnou kompatibilitu.
- [x] **`header.ts`** — duplicitní string `"Seed 12 Wh"` nahrazen `${ENERGY_SEED}` (DRY).
- [x] **Docs cleanup** — SPEC §4.1 Cell → BAY/SEGMENT, SCENARIO Echo/Kredo → Energy/Coin (9 výskytů), SCENARIO Appendix B CELL_TYPE → MODULE_TYPE, POC_P1 §10 retirovaná poznámka o Kredo.
- [x] **MINDMAP sync** — §4.5 Scripted events a §6.5 Moderation & LLM `[○]` → `[◐]`.
- [x] **Fix POC_P1 §13 indexace** — TODO položka přesunuta; bug byl opraven už v S16 (`row*8+col` v `POC_P1.md` §13 i v kódu).

### Simulation axioms + Status tree (GLOSSARY kánon)
- [x] **Colony Goal (single axiom)** — trvale udržitelný život a rozvoj člověka; kompas ≠ win condition.
- [x] **Perpetual Observer Simulation axiom** — svět žije nepřetržitě, bez hráčů/NPC/HP; server end = jediný terminál.
- [x] **Two Perspectives axiom** — Observer bez GAME_OVER, Player s GAME_OVER (P2+).
- [x] **Maslow axiom** — osy I–IV nezávislé, strategie investic hierarchická.
- [x] **FVP** pojem — First Viable Product (≠ P1 POC), observable simulation sandbox.
- [x] **Status tree** — strom zdraví kolonie (I Aktuální stav / II Udržitelnost / III Rozvoj / IV Společenský kapitál × kvantita/kvalita), parent = worst child, FVP metriky per uzel.

### Simulation loop scaffold
- [x] **`stepWorld` 11-slot pipeline** — decayTick / resourceDrain (legacy wrap) / autoEnqueueTasks / assignIdleActors / progressTasks / actorLifeTick / productionTick / arrivalsTick / scheduledEvents / recomputeStatus / appendEventLog. Sloty 1, 3, 6–11 = no-op stuby; slot 2 drží legacy phase_a/b/c drain.
- [x] **`Actor.state += "dead"`** — připraveno pro wire (aktér může být dead bez end of simulation).

### Event Log System spec
- [x] **GLOSSARY §Event Log System** — datový model `Event`, verb katalog (23 verbů, Unicode ikony), consequence (`OK/FAIL/PARTIAL/CRIT/START`), severity → paleta, ring buffer 500, lazy filter chips axiom, UI Event Log Card (layer 3.5, hotkey `[E]`, alpha 0.9 + stroke border, auto-scroll bez pauzy simulace).
- [x] **`FONT_SIZE_CMD = 12px`** — Bottom Bar Commands font o ¼ menší než HINT (per user request).
- [x] **Commands hint update** — `[E] event log  [H] help  [WASD] select bay` (hotkey [E] zapsán, implementace v TODO).
- [x] **Events rozlišení** — GLOSSARY §Events rozděleno: narativní (scripted SCENARIO §5) vs. Event Log (telemetrie).

### Session log
- [x] **`.claude/sessions/2026-04-15.md`** — přidána S20 sekce (detail výše).

## 2026-04-14 (Sezení 16 — HP-unified axiom + HUD live + Mateřská loď)

### Model & world

- [x] **HP-unified damage axiom:** `Tile.empty`+`Tile.damaged` mají `hp`+`hp_max`, `Module` rozšířen o `hp_max`. `TILE_HP_MAX = 10`, `WD_PER_HP = 1`. Task engine spojitě synchronizuje `tile.hp` s `wd_done` při progressu.
- [x] **Mateřská loď v `createInitialWorld`** dle POC §3: Habitat (idx 0), SolarArray (1), MedCore (2), Assembler (3), CommandPost (4), Storage (5), Engine 2×2 (6,7,14,15). `placeModule` helper s nested loop přes def.w×def.h.
- [x] **MODULE_DEFS rozšířen** o 5 mateřských modulů (Habitat, Storage, MedCore, Assembler, CommandPost) s placeholder hodnotami + TODO calibrate.
- [x] **Engine 2×1 → 2×2** fix (POC §3 autorita).
- [x] **DAMAGED_TILE_IDX 5 → 12** (idx 5 teď obsazuje Storage).
- [x] **Energy seed 12 Wh** v `world.resources.energy` + `ENERGY_MAX = 48`.
- [x] **`computeWork(world)` helper** — Work derivovaný z actors (Σ power_w working / všech). DRY axiom.

### HUD & UX

- [x] **HUD napojen na model** — 5 resource barů čte live z `world.resources` + `computeWork`. Tooltipy live refreshují.
- [x] **Dev-only `window.__world` exposure** přes `import.meta.env.DEV` + `tsconfig types: ["vite/client"]`.
- [x] **Start ihned** po loadu — `startGame(world)` v `create()`, SPACE odstraněn.
- [x] **10 asteroidů** vypuštěno na startu, klávesa [L] odstraněna.
- [x] **Klávesy R/E/X, šipky ↑↓, F5 hint** odstraněny. Zůstaly WASD, H, ESC, klik.
- [x] **WASD selection movement** — `SegmentPanel.moveSelection(dx, dy)`, clamp 0..7 × 0..1.
- [x] **Fokus tile [0,0] při startu** — `selectedTileIdx = 0` default v SegmentPanel.

### Vizuál

- [x] **Damaged overlay** — červený fill Rectangle (`0xcc3333`), alpha 0..0.6 úměrně `1 - hp/hp_max`, depth 10. Pro `module_ref` čte HP z připojeného modulu. `floor_damaged.png` smazán (nahrazeno overlayem).
- [x] **Construction.png fallback** — `drawTileSprite` při chybějící textuře kreslí `tile_construction` (černo-žluté hazard pruhy). Univerzální pro tile i module sprites.
- [x] **Tooltip live-refresh timer** (100 ms) + pointermove provider re-volání. Text reflektuje spojitě měnící se data.
- [x] **Drift vektor pozadí** 7 px magnitude, perioda 240 000 ms wall = 1 game day. `BackgroundSystem.tickDrift(delta)` per-frame, `applyTransform()` skládá drift + cameraY.
- [x] **SolarArray asset** připojen (`art/modules/solar_panel.png` → `public/assets/modules/solar_array.png`). `AVAILABLE_MODULE_ASSETS = ["SolarArray"]` whitelist v preloadu.

### INSPECTOR

- [x] **Dynamický header** — label "INSPECTOR" zrušen, nahrazen Text node aktualizovaný per render: empty→`Hull plating`, damaged→`Hull breach`, module→`{label} {w}×{h}`.
- [x] **@THINK diskuse** — 5 diagnóz + 3 směry (Universal Detail View, Command Center, Flex layout). Doporučené Q1+Q2. Parkováno v MINDMAP fokusu.

### Dokumentace & memory

- [x] **`IDEAS.md`** — nová sekce „HP-unified damage axiom (S16)".
- [x] **`TODO.md`** — 5 HP-unified úkolů + Multi-tile sprite rendering.
- [x] **`art/modules/PROMPTS.md`** — AI prompt pro nano-banana-2 s V1/V2/V3 constraints (chunky res, strict 2D top-down, 8-bit paleta), 4×3 grid + Engine/Dock 2×2 samostatný sheet.
- [x] **`memory/feedback_asset_delete_check.md`** — Grep references + aktivní námitka před smazáním core assetu.
- [x] **`MINDMAP.md` v1.9 → v2.0** — fokus přepsán.

## 2026-04-13 (Sezení 13–15 — Audit + refactor)

### S13 Audit 260413 + fixes (CODE F1/F2/F5/F12, DOCS F2/F3/F4/F5/F10)

- [x] **@AUDIT** paralelně DOCS + CODE, reporty do `audit/audit_260413_docs.md` a `audit/audit_260413_code.md`.
- [x] **CODE F1 Resource Model refactor** — `world.ts` `{air, food, kredo}` → `{slab:{food}, flux:{air}, coin}`, `model.ts` `cost_kredo` → `cost_coin`, testy aktualizovány.
- [x] **CODE F2 Hotkeys case-insensitive** — unified `keydown` handler s `event.key.toLowerCase()`.
- [x] **CODE F12 Smoke test** — `renderBar` přesunut do `format.ts` + 5 nových testů. 40 → 45 zelených.
- [x] **DOCS F2 Echo/Kredo sweep** — SPECIFICATION §4.5 (Resource Model v0.1), IDEAS §Ekonomika, POC_P1 §10/§13/§16, GLOSSARY legacy sekce retired.
- [x] **DOCS F5** SCENARIO §1.1 T4 kandidát tón, **F10** POC_P1 §10 P1-lokální seed header.

### S14 SCENARIO refactor (DOCS F1) + SPECIFICATION v0.2 (F11)

- [x] **SCENARIO.md v0.5** — smazáno §2.LEGACY + §2 Backbone (legacy) duplicate; §3 → Appendix A (Invitation), §4 → Appendix B (Awakening). Cross-refs přepsány.
- [x] **SPECIFICATION.md v0.2** — nová §10.1 RESOLVED sekce (12 uzavřených Q), ERRORS prázdné, GAPS 11 → 8, Q-Brains-Schema reklasifikován P1 → P2+.

### S15 CODE F3 GameScene split + UX polish + Observer mode axiom

- [x] **GameScene split 759 → 201 LOC** (−73 %). Vytvořen `apps/client/src/game/ui/`: `layout.ts`, `panel_header.ts`, `header.ts`, `actors.ts`, `segment.ts`, `side_right.ts`. GameScene = orchestrator.
- [x] **Top Bar vycentrován** — `HeaderPanel.render()` měří total width a pozicuje od středu (`x = (CANVAS_W − totalW) / 2`).
- [x] **Help přesunut do Bottom Baru** — inline v centrovaném hintu `[SPACE] start  [H] help  [L] asteroid …`, hotkey `H` trigger.
- [x] **Observer vs. Player mode axiom** — GLOSSARY §UI Modes (kolonijní vs. per-actor HUD), POC_P1 §16 poznámka, TODO P2+ sekce s Player mode úkoly.

## 2026-04-13 (Sezení 9 — Data model + FSM do kódu)

- [x] **`apps/client/src/game/types.ts`** — kompletní typy §13: `World`, `Tile` (tagged union), `Module`, `Actor`, `Task`, `Phase`, `LossReason`. Indexace segmentu row-major `row*8+col`.
- [x] **`apps/client/src/game/world.ts`** — world engine bez Phaser importu: seed konstanty (TICK_MS 250, AIR_TIMEOUT_TICKS 1560, FOOD_DRAIN 8/960), `createInitialWorld`, 4 FSM přechody (`startGame`, `repairDone`, `dockComplete`, `endDay`), `stepWorld` s air/food drainem a loss guardy.
- [x] **`apps/client/src/game/GameScene.ts`** — tick akumulátor v `update(time, delta)`, debug HUD (phase, tick, wall-sec, air/food/kredo), debug klávesy SPACE/R/E/W.
- [x] **`BootScene` → `ArtRefScene`** přejmenováno; přepínač scén přes `?scene=artref` v URL, default `GameScene`.
- [x] **Smoke test user průchodem FSM** — SPACE → R → E → W → WIN. Tick 449 = 112.25 s wall, air 79.3 %, food 38.95, kredo 20. Čísla sedí.

## 2026-04-13 (Sezení 8 — Skeleton + img2img reference art)

- [x] **pnpm 10.33 nainstalován** přes `npm i -g pnpm` (corepack selhal na admin právech).
- [x] **Monorepo workspace:** root `package.json` + `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
- [x] **`apps/client` skeleton:** Vite 5.4 + TypeScript 5.6 strict + Phaser 3.87, `type: module`, `base: "./"`, scale FIT 1280×720.
- [x] **`BootScene.ts` — 2×8 reference grid:** tile 150×150, GRID 1200×300 (4:1), dock T4+T5 sloučený, labely T1–T8/B1–B8 mimo export area.
- [x] **PNG export:** klávesa `P` → `snapshotArea` → download `voidspan-grid-2x8.png`. Klávesa `L` = toggle labelů. Fix: `render.preserveDrawingBuffer: true` (bez něj WebGL vrací prázdný buffer).
- [x] **`.gitignore`** rozšířen (node_modules, dist, .env…).
- [x] **Build + dev server ověřeny** (`pnpm build` čistý, `pnpm dev` běží na :5173).
- [x] **Art reference ověřena:** img2img workflow s grid PNG dodržel geometrii ~7/16 tiles, zbytek (zaoblený obrys lodi) → přijato jako **style placeholder**, ne grid-accurate reference. Styl Dune II drží.

## 2026-04-13 (Sezení 7 — POC_P1 spec ready-to-code)

- [x] **Q-P1-Arch:** Architektura P1 = **pure client, static hosting** (Vite + TS + Phaser 3, GH Pages / Netlify). Žádný server, žádná DB, žádný log.
- [x] **Q-P1-Telemetry:** Žádný event log v P1. Feedback mimo hru (rozhovor s P1–P4).
- [x] **Seed kalibrace (CAL-*):** SolarArray 24W, Constructor 12W, Hauler 8W, 3 Constructor + 2 Hauler, TIME_COMPRESSION 240×, Engine 60 WD (revize ze 120), Dock 48 WD + 20 ◎ (Coin; v S7 zapsáno jako „Kredo", přejmenováno v S13), Storage 40 jídla.
- [x] **Q-P1-Input:** Task-oriented (hráč cíle, engine auto-assign dronů) s micro-override. Priority drag&drop.
- [x] **Q-P1-Character:** Hráč = aktér-drone (W=8), v P1 vždy `working`, prohrává s kolonií.
- [x] **Q-P1-Tick:** Logický tick 250 ms (4×/s), render na rAF.
- [x] **Data model (§13):** TypeScript skelet — World, Tile (tagged union), Module, Actor, Task, Phase.
- [x] **State machine (§14):** `boot → phase_a → phase_b → phase_c → win|loss` se side-effecty a LOSS reason.
- [x] **Q-P1-UI:** Wireframe 1280×720, horizontální 8×2 segment, Actors left, Task Queue + Inspector right, HUD top, Log bottom. Ikony **Tabler** (free MIT).
- [x] **Q-P1-Onboarding:** Diegetický onboarding prvních 30 s, klik „Probuzení" → HULL BREACH → 2 contextové bubliny → task. Tón: suché military/tech.
- [x] **Q-P1-Dialogs:** 2 WIN + 3 LOSS varianty závěrečných dialogů. Struktura: header + narativ + signature + „Nová hra: refresh."
- [x] **POC_P1.md v0.1 → v0.7** — §12 architektura, §13 data model, §14 state machine, §15 input, §16 UI wireframe, §17 onboarding, §18 závěrečné dialogy.
- [x] **TODO.md** — Stack rozdělen na P1 scope (pure client) vs. P2+ scope. HelloWorld pilot re-scoped na Vite+Phaser+GH Pages. CAL-* z `[ ]` na `[~]` se seed hodnotami.
- [x] **MINDMAP v1.3** — 6.1/6.2 aktualizovány na P1 vs. P2+ stack, fokus posunut na Art sezení + `pnpm init`.

## 2026-04-12 (Sezení 6 — POC_P1, SHIP revize)

- [x] **Q17 rozsah P1 POC** uzavřeno: **single-player puzzle** s WIN/LOSS, jedním pokusem, refresh = nová hra.
- [x] **Scénář P1** = (A) Únik vzduchu (krize, time-pressure) + (B) Engine→Dock (normal task) + (C) volitelný bonus.
- [x] **SHIP revize** na 1 segment (S5 2-segment config byl over-provisioned — modulová math se vešla do 16 tiles s 1×1 moduly).
- [x] **Bez brains v P1** — přímé příkazy (brains = P2+).
- [x] **`CONST_PUZZLE_SLACK_FACTOR = 2`** — univerzální heuristika (timeout/budget = 2× optimum).
- [x] **POC_P1.md v0.1** založen — 11 sekcí, goal+format+scope+scénář+in/out+WIN/LOSS+kalibrace+asset list+success criteria.
- [x] **GLOSSARY v0.4** — SHIP section přepsána, SHIP-Bow/Stern retired, konstanta přidána.
- [x] **SCENARIO v0.4** — §4.0 SHIP Wake-up aktualizován na 1 segment.
- [x] **TODO** — Q17 uzavřeno, CAL-* kalibrační sekce přidána, Art sezení P1 naplánováno.
- [x] **MINDMAP v1.2** — fokus posunut na Art sezení + kalibraci + 3.2 Postava.

## 2026-04-12 (Sezení 5 — Prostor a čas, datový model, Energy Model)

- [x] **Hierarchie entit** WORLD → BELT → SEGMENT → MODULE → TILE ustavena; „Cell" retirováno.
- [x] **CONST_BELT_LENGTH = 256**, **CONST_SEGMENT_VOLUME = 16** (grid 2×8).
- [x] **SHIP startovní konfigurace** = 2 segmenty (Bow + Stern), 32 tiles, 8 zakládajících kolonistů v kryo.
- [x] **Energy Model** (W / WD) ustaven — jednotná mechanika pro hmotnou práci.
- [x] **Capability Matrix** (Build/Haul/Guard/Heal/Fight) + specializace (1 role na slot).
- [x] **Drone Fleet** = 8 Constructors + 4 Haulers + 4 Marshals (multi-funkční, analogie Module Specialization).
- [x] **Module Specialization Principle** (integrované slabé → dedikované mocné).
- [x] **HOMELESS status** + HP drain 1 HP / herní hodina.
- [x] **Lawlessness formula** (KISS linear, `belt.lawlessness = max(0, 1 - marshals/CONST_MARSHAL_BASELINE)`).
- [x] **Time model** — základní jednotka 1 s, herní den 16 h, TIME_COMPRESSION ~16×.
- [x] **Schedule activities P1** = Work | Eat | Sleep | Relax | Move.
- [x] **Q12 jméno hvězdy = Teegarden's Star** (SO J025300.5+165258), soustava = Teegarden System.
- [x] **Q-World-1 vertikální síť beltů** kolem Teegardenu, adresa `Teegarden.BeltN`.
- [x] **Observatory Event** (scripted) jako narativní trigger R1 Belt Network.
- [x] **Founding Colonist Invitation** (nový typ pozvánky, garantované oživení pro prvních 8).
- [x] **SHIP Wake-up scénář** v SCENARIO §4.0.
- [x] **GLOSSARY.md v0.3** — kompletně přepsán k hierarchii a Energy Modelu.
- [x] **MINDMAP 3.1 [◐] → [●]**, 4.3 Network Arc [○] → [◐].

## 2026-04-12 (Sezení 4 — Mapa, refactor, SPECIFICATION)

- [x] **Založen MINDMAP.md** — kořenová mapa projektu, stavy uzlů, čte se na `@BEGIN`, aktualizuje na `@END`.
- [x] **Bod 1 mapy (PROČ) uzavřen** — cílový hráč dvoufázově, zážitek sociální drama, autorská motivace 3 vrstvy, žánr 40/40/20.
- [x] **Bod 2 mapy (CO) uzavřen** — Dune II look, tenety jako kandidáti, prolog únik ze Země, Cell Binding Protocol, Faction Hierarchy 4×3.
- [x] **Bod 3 refactor** — 9 → 3 hlavních uzlů; Prostor → Postava → Oblasti; 6 konsolidovaných větví.
- [x] **Bod 4 refactor** — SVĚT → OBLOUKY/ARCS, 4 game-loopy A/B/C/D.
- [x] **Player Arc (C) draft** v SCENARIO.md.
- [x] **Session Arc (D) draft** v SCENARIO.md — rytmus 1×/den.
- [x] **Brains revize** — z „Phase 2+" na core POC feature.
- [x] **Q-Player-Schema:** POC = STATUS + RANK + SKILL, PERK Phase 2+.
- [x] **Q9 Tempo:** time-gated akce, brains drží prioritu, žádná denní energie.
- [x] **Revize R1/R2/R3** zapsány v IDEAS.md.
- [x] **SPECIFICATION.md v0.1 DRAFT** založena — zadávací dokumentace s červeně označenými mezerami.
- [x] **@AUDIT:DOCS první** — `audit/audit_260412.md`, 11 findings, ★4.0/5.
- [x] **Audit low-effort fixy (F2/F3/F5/F7/F11):** Q9 duplikát, Act→Arc reference v GLOSSARY, Q-status flagy, T3 kandidát, prototyp→POC sweep.

## 2026-04-12 (Sezení 2 — Hosting & Stack)

- [x] **Q6:** Zjistit typ hostingu na Betelgeuse.com. **Zjištěno:** Forpsi Easy Windows (sdílený IIS 10, PHP + .NET Core, MSSQL 2019 + MySQL 8, App Pool 256 MB / 25 % CPU, Timer pro plánované úlohy). Pro real-time perzistent world **nestačí**.
- [x] **Rozhodnutí A2 — Real-time VPS.** Volba: **Forpsi VPS Linux Basic** (160 Kč/měsíc, 2 vCPU, 4 GB RAM, 40 GB NVMe, root).
- [x] **Q12:** Backend runtime → **Node.js 22 + TypeScript**.
- [x] **Q13:** Databáze → **SQLite pro prototyp**, Postgres později.
- [x] **Q14:** Frontend engine → **Phaser 3** (Voidspan = živý animovaný svět, ne statická mapa).
- [x] **Q15:** Síťový protokol → **Colyseus** (authoritative server, auto state sync).
