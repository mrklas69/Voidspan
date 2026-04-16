# Audit Voidspan — 2026-04-16 (CODE)

**Typ:** `@AUDIT:CODE` — terminologie, architektura, kvalita, soulad se záměrem.
**Auditor:** Claude Opus 4.7 (1M), začátek sezení 28.
**Scope:** `apps/client/src/`, `package.json`, `tsconfig.json`.
**Verze kódu:** 0.7 (FVP Observer Edition). **Commit:** `211f40a` (S27 @END).
**Testy:** 53/53 zelených (Vitest 2.1.9). **TS strict:** clean build.
**Předchozí CODE audit:** `audit_260413_code.md` (verze 0.5.0, S12/S13 přechod).

---

## Scorecard

| Metrika | Hodnota | Vs. 04-13 | Stav |
|---|---|---|---|
| LOC (src/game) | 6 288 | +148 % | ⚠ růst koncentrovaný v `world.ts` |
| Počet TS souborů | 25 | +11 | ✓ rozumná granularita |
| Test files | 3 (53 testů) | +13 testů | ✓ 53/53 zelených |
| TS strict | vynucen | = | ✓ clean build |
| Komentáře česky | 100 % | = | ✓ |
| Hex literály mimo paletu | 3× `0xffffff` (mask) | (-) | ✓ legitimní Phaser pattern |
| `as unknown as` | 2× | -1 | ⚠ F4 z 04-13 stále otevřený |
| `console.*` v src | 0 | = | ✓ čisté |

---

## Axiomy — soulad

| # | Axiom | Stav 04-13 | Stav 04-16 |
|---|---|---|---|
| 1 | Resource Model | ❌ DEBT | ✅ KISS (S25/S26 — solids/fluids/coin) |
| 2 | formatScalar (2 sig, SI) | ✅ | ✅ |
| 3 | UI Layout (3 zóny + 5 floating) | ⚠ partial | ✅ 4/5 floating (info/modules/event/task) |
| 4 | Font preload | ✅ | ✅ (S27 KISS ASCII pro VT323 latin-subset) |
| 5 | Hotkeys case-insensitive | ❌ missing | ✅ (`GameScene.ts:253` unified handler) |
| 6 | Model-first architektura | ✅ | ✅ (world.ts bez Phaser, čistá logika) |
| 7 | Magenta keying | ℹ N/A | ℹ N/A |
| 8 | Task engine §15 | ⚠ KISS | ✅ recipe-aware, eternal services, autopilot |
| 9 | FSM data model | ✅ | ✅ |
| 10 | 16-color paleta (memory) | ✅ | ✅ (žádné ad-hoc hex literály) |
| 11 | HP-unified damage axiom (S16) | ✅ repair | ⚠ build/demolish stále chybí |
| 12 | Status indikátor = barva metriky (S25 memory) | ✅ | ✅ (`ratingColor()` helper, semafor sdílí metriku) |
| 13 | Code EN / display CZ (S25 memory) | n/a | ✅ |

**Skóre:** 11/13 ✅, 2/13 ⚠. **Žádný axiom violation.**

---

## Vyřešeno z auditu 04-13

| # | Issue | Sezení | Pozn. |
|---|---|---|---|
| F1 [CRIT] | Resource Model `{air,food,kredo}` → `{solids,fluids,coin}` | S23–S26 | KISS FVP (subtypy P2+) |
| F2 [MAJ] | Hotkeys case-insensitive | S?? | `event.key.toLowerCase()` v unified handleru |
| F3 [MAJ] | GameScene 748 → 314 LOC | S?? | HeaderPanel/SegmentPanel/InfoPanel/EventLog/TaskQueue/ModulesPanel extrahovány |
| F5 [MIN] | Kredo terminologie | S25 | Coin napříč |
| F8 [MIN] | UI Layout floating panels | S22–S26 | 4/5 floating: I/M/E/T (K/U/Z/P stále chybí) |
| F9 [MIN] | Task engine rozšíření | S24–S26 | recipe-aware, eternal services, QM autopilot, ETA, autoclean |

---

## FINDINGS (nové + přetrvávající)

### F1 `[MAJ]` — `world.ts` nabobtnal (1166 LOC, 38 funkcí)

**Stav:** STRUCTURAL DEBT. Nový (po 04-13).
**Detail:** `world.ts` je zatím jediný engine soubor (model + tuning v sourozencích). Vzrostl z ~600 LOC na 1166 LOC, 38 funkcí. Obsahuje:
- formátovače času (`formatGameTime`, `formatEta`)
- task helpery (`describeTaskTarget`, `taskActionCs`, `taskEtaTicks`)
- world setup (`createInitialWorld` = 167 LOC, 158→325)
- damage utilities (`applyLightWear`, `applyRandomDamages`, `collectDamageTargets`)
- task engine (`enqueueRepairTask`, `assignIdleActors`, `progressTasks`, `cleanupOldTasks`, `completeTask`)
- flow ring (`recordFlow`, `advanceFlowDay`, `shiftRing`, `averageFlow`)
- recipe (`getTaskRecipe`, `whichResourceMissing`, `consumeResources`, `firstMissingRecipeCategory`)
- pipeline sloty (`decayTick`, `protocolTick`, `productionTick`, `recomputeStatus`, …)
- 11-slot orchestrátor (`stepWorld`)

**Impact:** SLAP rozpadá se. Hledání („kde je decayTick?") narůstá. Test soubor `world.test.ts` má už 28 testů a sdílí jediný file scope — rozhodnutí o reorganizaci se odkládá.

**Akce — extrakce do `world/`** (kompozičně, beze změny veřejného API):
1. `world/format.ts` — `formatGameTime`, `formatEta`
2. `world/task.ts` — task helpery + engine (`enqueue`, `assign`, `progress`, `cleanup`, `complete`, `describe`)
3. `world/recipe.ts` — recipe util
4. `world/flow.ts` — FlowRing
5. `world/protocol.ts` — `protocolTick` + helpers
6. `world/decay.ts` + `world/production.ts` + `world/status.ts`
7. `world.ts` zůstává tenký orchestrátor (`createInitialWorld`, `stepWorld`, re-exporty)

~3–4 h. Zlomí 0 testů (čistá kompozice). Odměna: čitelnost, mergeable parts, nezávislé testy per modul.

### F2 `[MAJ]` — UI panely duplicitní kostru (info / modules / event / task)

**Stav:** DRY VIOLATION. Nový.
**Detail:** Čtyři floating panely (`info_panel`, `modules_panel`, `event_log`, `task_queue`) sdílí identický skeleton:
- LS persistence pattern (`loadVisiblePref/saveVisiblePref`, `LS_KEY`)
- container/header/scroll/scrollbar struktura
- `setOnToggleOpen()` pro mutex (radio mezi sourozenci)
- `relayout()` při resize
- `attachTooltips()`
- mask graphics (`maskGraphics.fillStyle(0xffffff)`) — viz F4

LOC celkem 1354 z čehož ~30–40 % je opakovaná kostra. Když přidáme pátý panel (Kolonisté [K], Politika [P], …), kopíruje se znovu.

**Akce:** Vytvořit `ui/floating_panel.ts` s `class FloatingPanel` (abstraktní base — drží container, header, mask, scrollbar, LS pref, mutex). Specifické panely jen overridnou `renderBody()`. ~2–3 h. P2 priorita — provádět **až** s pátým panelem (premature now).

### F3 `[MAJ]` — UI panely bez unit testů

**Stav:** TEST GAP (přetrvává z F12 04-13, rozšířený scope).
**Detail:** Žádný z `info_panel`, `modules_panel`, `event_log`, `task_queue`, `ui/header`, `ui/segment`, `welcome` nemá test soubor. Test pokrytí 9.5 % (601 test LOC / 6288 src LOC).

Logika v panelech je **neviditelná** pro CI: lazy filter chips (`event_log`), task lifecycle render (`task_queue`), HP rating barva (`info_panel`), scroll bounds, mask offset.

**Akce:**
- Phaser headless test setup (jsdom + canvas mock) — investice ~2 h.
- Smoke testy per panel (open/close/render/no-throw) — ~1 h per panel.
- Logika oddělitelná do čistých funkcí (např. `event_log.ts:filterEvents()`) → testovat bez Phaseru — preferováno.

P2 priorita. Cíl: 30 % LOC pokrytí do release Player Awakening.

### F4 `[MIN]` — Tooltip CSS type assertion (přetrvává z 04-13)

**Stav:** UNCHANGED.
**Detail:** `tooltip.ts:96` stále používá `as unknown as { input: ..., setInteractive: ... }` cast pro „ensureInteractive" fallback.

**Akce:** Vytvořit `type InteractiveGameObject = Phaser.GameObjects.GameObject & { input: ...; setInteractive: ...; }`. ~10 min. Backlog.

### F5 `[MIN]` — ESC handler není globální

**Stav:** AXIOM PARTIAL (TODO §UI Layer Stack — „ESC = globální bezpečný odchod").
**Detail:** ESC reaguje jen v `modal.ts` (help) a `welcome.ts`. Floating panely (E/T/I/M) ESC neignorují, ale ani nezavírají — uživatel musí znovu hotkey nebo `[X]`. Pořadí podle TODO: overlay → floating → modal → nic.

**Akce:** Centralizovat v `GameScene` `ModalManager` (nebo nový `ModalStack`). ~1–2 h. Volně se napojí na otevřený `Q-Modal-Stack` v TODO.

### F6 `[MIN]` — `0xffffff` v `fillStyle` mask graphics (3 místa)

**Stav:** CODE SMELL.
**Detail:** `info_panel.ts:184`, `modules_panel.ts:156`, `welcome.ts:201` používají literální `0xffffff` pro mask alpha. Je to standardní Phaser pattern (white = visible mask), ale paletový axiom říká „nikdy ad-hoc hex". Nejedná se o vizuální barvu — je to bitmask flag.

**Akce:** Přidat `UI_MASK_WHITE = 0xffffff` do `palette.ts` s komentářem „Phaser mask graphics: white = visible (NIKOLI vizuální barva, není v 16-color paletě)". ~5 min. Drží konzistenci „zero hex literals outside palette".

### F7 `[MIN]` — `world.test.ts` 443 LOC sdílí scope

**Stav:** TEST DEBT.
**Detail:** `world.test.ts` má 28 testů ve 7 describe blocích (`createInitialWorld`, `stepWorld`, `getOuterHP`, `enqueueRepairTask`, `QuarterMaster runtime`, `Recipe-per-target repair`, `Flow history`). Při extrakci F1 by se přirozeně rozpadly do per-soubor testů.

**Akce:** Po F1 extrakci rozhodit testy per modul (`task.test.ts`, `protocol.test.ts`, `recipe.test.ts`, `flow.test.ts`).

### F8 `[INF]` — HP-unified damage axiom (S16) — build/demolish chybí

**Stav:** PARTIAL (známé z TODO).
**Detail:** Repair branch hotov (S16). Build/demolish pořád neaktualizují HP přes WD task. Aktivuje se až s commands palette `[B]/[D]` (Release 2 fokus).

### F9 `[INF]` — Pipeline no-op sloty

**Stav:** ARCHITECTURE BY INTENT.
**Detail:** `actorLifeTick`, `arrivalsTick`, `scheduledEvents`, `appendEventLog`, `autoEnqueueTasks` jsou no-op stuby s `_w` underscore prefix. Pořadí pipeline je fixní (axiom z IDEAS S20/S21), těla doplnit po jednom kuse. Nejedná se o dluh — je to **vědomě zachovaný kontrakt**.

### F10 `[INF]` — Komentáře česky 100 %, identifikátory anglicky

**Stav:** COMPLIANT (nová memory `feedback_lang_convention.md` z S25).
**Detail:** Bez výjimky.

### F11 `[INF]` — Model-first architektura excellent

**Stav:** COMPLIANT.
**Detail:** `world.ts` nemá Phaser import (kromě JSDoc-only zmínek). Logika testovatelná solo. Panely čtou přes closure (`getWorld()`), ne přímý import.

### F12 `[INF]` — Paleta + RATING_COLOR + semafor disciplína

**Stav:** EXEMPLARY.
**Detail:** `palette.ts` (158 LOC) drží 16 barev + sémantické aliasy + `RATING_COLOR` 5-state semafor + `ratingColor(pct)` helper. Žádný panel nedefinuje vlastní barvu. S23/S25 axiom „indikátor a barva sdílí metriku" implementován konzistentně.

---

## Kvantitativní shrnutí

| Kategorie | Počet | Nové od 04-13 | Vyřešené |
|---|---|---|---|
| CRIT | 0 | 0 | F1 |
| MAJ | 3 (F1, F2, F3) | F1, F2 (F3 = bývalé F12) | F2, F3 |
| MIN | 3 (F4, F5, F6) | F5, F6 | F5(staré), F8(staré), F9(staré) |
| INF | 5 (F7–F12) | — | — |

---

## Priorizovaný akční seznam

### Sprint NYNÍ (před Release 2 — Player Awakening)
1. **[MAJ] F1 — Extrakce `world.ts` → `world/`**. ~3–4 h. Zlomí 0 testů. **Doporučeno hned**, než narostou další 200 LOC v decayTick + production + protocol.
2. **[MIN] F6 — `UI_MASK_WHITE` konstanta**. ~5 min. Triviální cleanup.
3. **[MIN] F4 — `InteractiveGameObject` type**. ~10 min.

### Po Release 2
4. **[MAJ] F3 — UI panel smoke testy** (jsdom + canvas mock).
5. **[MIN] F5 — Globální ESC handler** (po Q-Modal-Stack rozhodnutí).
6. **[MAJ] F2 — `FloatingPanel` base** — **až s 5. panelem** (premature dnes).

### Backlog
7. F7 — Rozhození testů per extrahovaný modul (po F1).
8. F8 — HP-unified build/demolish branch (po commands palette).

---

## Závěr

Projekt udělal **významný skok kvality** od auditu 04-13: 4 z 5 dluhů z předchozího sprintu vyřešeny (F1 Resource Model, F2 hotkeys, F3 GameScene rozdělení, F8 floating panels parciálně, F9 task engine). **Žádný axiom violation, žádný TS error, 53/53 testů zelených.**

Zbylé dluhy jsou **architektonické a růstové**, ne behaviorální:
- `world.ts` 1166 LOC je největší odložený refaktor (F1) — měkká blokáda pro Release 2.
- 4 panely sdílí kostru (F2) — necháme dozrát na 5. panel.
- UI vrstva bez testů (F3) — riziko regresí při refaktoru tooltipu/scrollu.

**Doporučení:** F1 (extrakce world.ts) ihned v dalším sezení, **PŘED** wake-up mechanismem (#1 v MINDMAP „Další bagr"). Wake-up + player HP otevře další 200–300 LOC v `actorLifeTick` + `productionTick` — chceme je vkládat do čistého modulu, ne do dalšího nárůstu monolitu.
