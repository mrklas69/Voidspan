# DONE.md — ⊙ Voidspan

Hotové úkoly. Přesouvá se z `TODO.md`.

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
