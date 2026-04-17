# Audit Voidspan — 2026-04-17 (CODE)

**Typ:** `@AUDIT:CODE` — terminologie, architektura, kvalita, soulad se záměrem.
**Auditor:** Claude Opus 4.7 (1M), začátek sezení 32.
**Scope:** `apps/client/src/`, `package.json`, `tsconfig.json`.
**Verze kódu:** 0.8 (FVP Observer Edition — Perpetual). **Commit:** `b880b61` (S31 @END).
**Testy:** 101/101 zelených (Vitest 2.1.9). **TS strict:** clean build.
**Předchozí CODE audit:** `audit_260416_code.md` (verze 0.7, S27/S28 přechod).

---

## Scorecard

| Metrika | Dnes | Vs. 04-16 (S28) | Stav |
|---|---|---|---|
| LOC src/game (bez testů) | 6 549 | +4 % (6 288 → 6 549) | ✓ kontrolovaný růst |
| Max LOC v 1 souboru | 507 (`event_log.ts`) | -57 % (1166 → 507) | ✓ SLAP drží |
| TS souborů src | 38 | +52 % (25 → 38) | ✓ granularita po world/ extrakci |
| Test soubory | 8 | +167 % (3 → 8) | ✓ logic-only suite roste |
| Testy | 101 | +91 % (53 → 101) | ✓ 101/101 zelených |
| Test LOC / src LOC | 16.5 % | +74 % (9.5 % → 16.5 %) | ⚠ cíl 30 % (Release 2) |
| TS strict | clean | = | ✓ |
| `as unknown as` | 3 (1 v src, 2 v testech) | +1 | ✓ všechno legit (LS mock + dev `__world`) |
| `console.*` v src | 0 | = | ✓ |
| Hex literály mimo palette | 0 | = | ✓ (`UI_MASK_WHITE`, background.ts hash seedy legit) |
| Komentáře česky | 100 % | = | ✓ |

**Shrnutí:** Kód narostl o 4 %, ale max soubor klesl o 57 %. Test pokrytí +74 % díky world/ extrakci (S28) + event_log.test.ts (S30) + panel_helpers.test.ts (S28). **Žádný axiom violation, 13/13 axiomů drží.**

---

## Axiomy — soulad

| # | Axiom | Stav 04-16 | Stav 04-17 |
|---|---|---|---|
| 1 | Resource Model (FVP KISS) | ✅ | ✅ |
| 2 | formatScalar (2 sig, SI) | ✅ | ✅ |
| 3 | UI Layout (3 zóny + 4 floating) | ✅ 4/5 | ✅ 4/5 (K chybí) |
| 4 | Font preload | ✅ | ✅ (S29 Atkinson Hyperlegible) |
| 5 | Hotkeys case-insensitive | ✅ | ✅ |
| 6 | Model-first architektura | ✅ | ✅ world/ nemá Phaser import |
| 7 | Magenta keying | ℹ N/A | ℹ N/A |
| 8 | Task engine §15 | ✅ | ✅ recipe-aware, QM autopilot |
| 9 | FSM data model | ✅ | ✅ |
| 10 | 16-color paleta | ✅ | ✅ (UI_MASK_WHITE legit Phaser flag) |
| 11 | HP-unified damage (S16) | ⚠ repair only | ⚠ build/demolish čeká na commands palette |
| 12 | Indikátor=barva metriky (S25) | ✅ | ✅ (ModulesPanel 5-color per-row, S31) |
| 13 | Code EN / display CZ (S25) | ✅ | ✅ |

**Skóre:** 12/13 ✅, 1/13 ⚠ (F11 build/demolish — čeká na commands palette v Release 2).

---

## Vyřešeno z auditu 04-16 (S28)

| # | Issue | Sezení | Pozn. |
|---|---|---|---|
| F1 [MAJ] | `world.ts` → `world/` extrakce | S28 | 1166 → 14 souborů, max 195 LOC |
| F4 [MIN] | `InteractiveGameObject` type alias | S28 | `as unknown as` cast retirován |
| F5 [MIN] | Globální ESC handler | S28 | `GameScene.handleEscape()` priority chain |
| F6 [MIN] | `UI_MASK_WHITE` konstanta | S28 | 3× hardcoded `0xffffff` migrováno |
| F7 [MIN] | `world.test.ts` per-modul rozhození | S28 | částečně — nové testy `world/{bay,flow,format}.test.ts`, ale `world.test.ts` stále 407 LOC |
| F2 [MAJ] | UI panel DRY | ODLOŽENO | „až s 5. panelem" — stále odloženo, nyní pálivější |
| F3 [MAJ] | UI panel unit testy | ČÁSTEČNĚ | +logic-only (panel_helpers, event_log) — Phaser entity testy chybí |

---

## FINDINGS (04-17)

### F1 `[MAJ]` — Stale komentáře: dokumentace v kódu lže

**Stav:** DOC DEBT. Nový.
**Detail:** Identifikátory a logika držely krok s iteracemi (S25-S31), ale komentáře nikoliv. Čtenář (vč. budoucího já / LLM) přijde k souboru a přečte zavádějící premisu.

**Konkrétní místa:**
- `model.ts:1-12` — **header souboru hlásí „layered bay axiom (S18)" jako aktivní.** Axiom retirován S28, komentář je 3. iterace od retire (S29/S30/S31 to neopravily). Na ř. 49 je S28 retirement poznámka, takže soubor si protiřečí.
- `model.ts:335-336` — komentář u `MODULE_DEFS`: „recipe je **per-HP rate**. Total build cost = recipe × max_hp." **Opak pravdy.** Po S30 jsou recipe v katalogu **TOTAL** hodnoty; runtime API (`recipe.ts`) dělí hp_max pro per-HP rate. Ř. 92-99 popisuje správně, ř. 335 ne.
- `model.ts:406` `Storage.description` „Sklad zásob (jídlo, kapalný kyslík)." — food + air retired S25.
- `model.ts:392` `Habitat.description` „P1: jeden probuzený kolonista (hráč)." — v FVP 32 kolonistů v cryo.
- `model.ts:378` `Dock.description` „WIN podmínka: ≥1 modul flotily připojen." — phase win/loss retirováno S23.
- `model.ts:364` `Engine.description` „K demontáži pro získání místa." — po S28 compact loď je Engine kotva cols 6-7, demontáž by rozpadla layout.
- `palette.ts:19, 36, 112` — „Flux.water/coolant" — rename na Fluids S25.
- `tuning.ts:41` „Kredo" — rename na Coin S25.
- `tuning.ts:55-59` „§3 HP axiom (S18) — layered bay vrstvy a WD konverze" — sekce o retirovaných skeleton/cover HP.
- `tuning.ts:114` „HP drain per tick při nedostatku (air=0 nebo food=0)" — air+food retired S25.
- `event_log.ts:69-70` „Default (prázdný LS) = jen TICK off (spec TODO)" — S30 default all-ON + S31 TICK retire.
- `ui/header.ts:25-27` „aby kroužek opticky seděl s baseline VT323" — VT323 retired S29.

**Impact:** Každý zde uvedený komentář je mikro-past. Při čtení kódu vznikne špatný mentální model → rozhodnutí postavené na tomto modelu se vrací jako bug.

**Akce:** Projít všech 13 míst, přepsat nebo smazat. ~1 h. Žádný test není v ohrožení.

### F2 `[MAJ]` — UI panely DRY violation (5. panel klepe na dveře)

**Stav:** ODLOŽENO z S28, nyní **dozrálé**.
**Detail:** 4 floating panely (`info_panel` 384, `modules_panel` 414, `event_log` 507, `task_queue` 318 = **1623 LOC**) sdílí ~60 % boilerplate:
- `container`/`bg`/`titleText`/`closeBtn`/`underline` build
- LS pref wiring (`LS_KEY` + `loadVisiblePref`/`saveVisiblePref`)
- Mask graphics (`UI_MASK_WHITE` rect)
- Scrollbar `scrollTrack`/`scrollThumb` + drag/wheel handlers
- Touch drag scroll (`dragY`/`dragOffset`/pointermove/pointerup)
- `dockManager.register`/`notifyChange`
- `toggle`/`close`/`isOpen` + `setOnToggleOpen`
- `renderBody`/`renderRows` pattern (plus InfoPanel s `render()` wrapperem)
- `attachTooltips` registrace

S28 audit argumentoval: **„až s 5. panelem (premature now)"**. Dnes je 5. panel na dohled:
- **Kolonisté [K]** (TODO Player mode) — per-actor HP/inventory sparkline
- **Commands [B/R/D]** (TODO Release 2) — nebo jako Bottom Bar chord
- Jakýkoli další (**Politika [P]**, **Ekonomika [E]** — konflikt, přejmenovat)

**Úspora:** `FloatingPanel` base class ~200 LOC → 4 panely × 80 LOC (jen specifický render) = **~1200 LOC → ~500 LOC** úspora. Nový panel klesne z 300+ LOC na ~100 LOC.

**Impact:** **Bez této extrakce každá UX iterace se udělá 4× (4 pointermove handlery, 4 LS mock patterns, 4 scrollbar bugfixes).** S31 stacků několik iterací napříč všemi 4 panely (ellipsize, footers, zebra stripes, tooltipy) — vidět v S30 logu.

**Akce:** Vytvořit `ui/floating_panel.ts` s `abstract class FloatingPanel`:
```ts
abstract class FloatingPanel {
  protected abstract panelId: string;          // "info" | "modules" | ...
  protected abstract side: "left" | "right";
  protected abstract title: string;
  protected abstract dockWidth(): number;
  protected abstract buildBody(contentW: number): void;  // specific UI
  protected abstract renderBody(): void;                  // per-frame
  // shared: bg, header, close, underline, mask, scrollbar, LS, drag, wheel,
  //         dock register, toggle, close, attachTooltips stub
}
```
~3-4 h refactor. Zlomí 0 testů (logic-only). **Doporučeno PŘED 5. panelem.**

### F3 `[MIN]` — `iconText` dead field v InfoPanel

**Stav:** CODE SMELL. Nový.
**Detail:** Po S31 hierarchical layout změně (`COL_OFFSET = 0`, `iconText.setText("")`) je `iconText` Phaser.GameObjects.Text, který se vytvoří, přidá do containeru, ale nikdy nezobrazí text. 3 místa:
- `info_panel.ts:62` field declaration
- `info_panel.ts:166-174` build + add
- `info_panel.ts:374` `this.iconText.setText("")` — každý render resetuje prázdný text

**Akce:** Smazat 3 místa. ~5 min.

### F4 `[MIN]` — `SEVERITY_COLOR` má slabší typ než je možné

**Stav:** TYPE WEAKNESS. Nový.
**Detail:** `event_log.ts:100`:
```ts
const SEVERITY_COLOR: Record<string, string> = { ... };
```
Mělo by být `Record<EventSeverity, string>`. Dnešní typ akceptuje klíč `"anything"` bez chyby. Kdyby přibyla severity (např. `"info"`), TS by nevaroval.

**Akce:** `import type { EventSeverity }` + změnit typ. ~3 min.

### F5 `[MIN]` — `drones: 23` magic number v init.ts

**Stav:** MAGIC NUMBER. Nový.
**Detail:** `world/init.ts:141`:
```ts
drones: 23,   // počet pracovních dronů — převodník E→WD, žádný HP
```
Hardcoded 23. `tuning.ts` má pro všechno ostatní seed konstanty (`SEED_SOLIDS`, `SEED_FLUIDS`, `SEED_COIN`, `SEED_CREW_CRYO`, `ENERGY_SEED`). `drones` ne.

**Akce:** Přidat `SEED_DRONES = 23` do tuning.ts §2 (seed), naimportovat v init.ts. ~3 min.

### F6 `[MIN]` — `appendEventLog` slot je prázdná funkce bez účelu

**Stav:** ARCHITECTURE AMBIGUITY. Nový.
**Detail:** `world/index.ts:119`:
```ts
function appendEventLog(_w: World): void { /* Events se emitují in-place přes appendEvent(). Slot zachován pro axiom pipeline pořadí. */ }
```
Vysvětlení „events se emitují in-place" znamená, že slot je mrtvý. Buď:
- **A)** Retire slot 11 úplně (pipeline má 12 slotů, pohodlně 11).
- **B)** Naplnit (batch aggregate hromadných eventů — např. cryo failure aggregate z `actorLifeTick` by mohl přeskočit do slot 11 místo in-place).

**Akce:** Rozhodnout A/B; bez rozhodnutí komentář mate. Drobnost, ale drží čistou pipeline.

### F7 `[MIN]` — Scene-level pointer listeners ve 4 panelech

**Stav:** POTENTIAL MEMORY LEAK. Nový.
**Detail:** Každý z 4 panelů registruje v `build()`:
```ts
this.scene.input.on("pointermove", ...);
this.scene.input.on("pointerup", ...);
this.scene.input.on("wheel", ...);
```
= 12 listenerů scene-level. Žádný `off()` v destroy / cleanup. Pokud se scéna v budoucnu restartuje (game restart, new seed), listenery se akumulují.

Dnes Phaser scéna `GameScene` je singleton — listenery tedy nezpůsobují bug. **Future risk.**

**Akce:** Spadá do F2 — base class bude mít `destroy()` + `off()` handlery centrálně. Solo akce nyní by předbíhala.

### F8 `[INF]` — Integrita (II.2) = Base (I.2) po S28

**Stav:** KNOWN TECHNICAL DEBT (TODO §II.2 jako rate).
**Detail:** `world/status.ts:43` `integrityPct = basePct`. Status tree tier2 = min(supplies, integrity=base). Takže base je váhován × 8 (tier1) i × 4 (tier2 uvnitř min). Filosoficky „dvojí započtení", prakticky neškodné (dokud base > supplies, nepřispívá; když je worse, tier2 se rovná tier1 duplikátu).

TODO už má plán přepsat na rate (Δ HP / game day). Vyžaduje stabilní decay + repair trend data, které dáš až wake-up + HP drain naplní panel.

**Akce:** Žádná teď. Po Release 2 (Wake-up + player HP) naplní data a TODO bod se rozjede.

### F9 `[INF]` — No-op pipeline sloty (kontrakt zachován)

**Stav:** ARCHITECTURE BY INTENT.
**Detail:** `resourceDrain`, `autoEnqueueTasks`, `arrivalsTick`, `appendEventLog` = prázdné stuby. Pipeline pořádí je kánon (IDEAS), těla se doplní postupně (`actorLifeTick` se naplnil S30 — cryo failure). **Není to dluh, je to záměr.**

### F10 `[INF]` — Test coverage 16.5 % (+74 % od S28)

**Stav:** ON TRACK K 30 % (Release 2 cíl z audit 04-16).
**Detail:** 101 testů v 8 souborech. Logic-only (žádný jsdom, žádný Phaser mock):
- `panel_helpers.test.ts` (12) — LS pref roundtrip, ellipsizePrefix
- `event_log.test.ts` (7) — filter LS pref
- `format.test.ts` (14) — formatResource, formatScalar
- `model.test.ts` (11) — MODULE_DEFS sanity + ACTOR_DEFS
- `world.test.ts` (26) — createInitialWorld, stepWorld, Task engine
- `world/bay.test.ts` (9) — getOuterHP, trajectory
- `world/format.test.ts` (12) — formatGameTime, formatEta, describeTaskTarget
- `world/flow.test.ts` (10) — FlowRing API

**Chybí (ranked):**
- `world/status.ts` — `statusRating`, `recomputeStatus` (SIGN emise, threshold transitions)
- `world/protocol.ts` — QM hystereze, pause/resume triggery
- `world/task.ts` — `assignIdleActors` priority + recipe gate
- `world/recipe.ts` — `whichResourceMissing`, `getTaskRecipe` total→per-HP
- Phaser entity smoke testy (F3 S28 — čeká na F2 base class pro jednodušší mock)

**Akce:** Backlog, +5 testů per týden by bylo tempo. Ne akční položka teď.

### F11 `[INF]` — Axiom #11 HP-unified damage — build/demolish čeká

**Stav:** PARTIAL (repair hotov S16, build/demolish čekají na commands palette).
**Detail:** Viz TODO §HP-unified damage axiom. `allowed_actors: ["player"]` v TASK_DEFS (model.ts:463-466) — ale v FVP drony pracují, hráč spí v cryo. Buď je gate dead, nebo chybí drone kind. Vyjasni s commands palette.

---

## Kvantitativní shrnutí

| Kategorie | Počet (04-17) | Nové | Vyřešené od 04-16 |
|---|---|---|---|
| CRIT | 0 | — | — |
| MAJ | 2 (F1, F2) | F1 (nový) | F1-S28 (world.ts) |
| MIN | 5 (F3, F4, F5, F6, F7) | F3, F4, F5, F6, F7 | F4-S28, F5-S28, F6-S28 |
| INF | 4 (F8, F9, F10, F11) | — | — |

---

## Priorizovaný akční seznam

### Sprint NYNÍ (před Wake-up, ~1.5 h celkem)

1. **[MAJ] F1 — Stale komentáře** — ~1 h. Projít 13 míst, přepsat/smazat. Nízké riziko, vysoká hodnota.
2. **[MIN] F3 — `iconText` dead field v InfoPanel** — ~5 min.
3. **[MIN] F5 — `SEED_DRONES` konstanta** — ~3 min.
4. **[MIN] F4 — `SEVERITY_COLOR` type** — ~3 min.

### Před 5. panelem (Kolonisté [K] / Commands [B/R/D])

5. **[MAJ] F2 — `FloatingPanel` base class** — ~3-4 h. Ušetří ~700 LOC napříč 4 panely; 5. panel klesne z 300+ LOC na ~100 LOC. Včetně F7 (listener cleanup).

### Backlog (po Release 2)

6. **[MIN] F6 — `appendEventLog` slot rozhodnutí** — retire (A) nebo naplnit batch aggregate (B). ~10 min.
7. **[INF] F8 — II.2 Integrita jako rate** — po wake-up + HP drain data.
8. **[INF] F10 — Test coverage → 30 %** — +5 testů / týden v world/protocol, task, recipe, status.

---

## Závěr

Projekt drží **vysokou disciplínu** napříč S29-S31: **žádný nový axiom violation, všech 13 axiomů drží, TS strict clean, 101/101 testů.** Tři sezení intenzivní UX iterace (font swap, 2×2 layout, 5-col tabulka, M-42, chip filters, cryo failure, recipe TOTAL) **nerozbily architekturu** — world/ extrakce z S28 se vyplácí.

**Hlavní dnešní dluh je `F1 — stale komentáře`:** kód sám je čistý a aktuální, ale 13 míst v komentářích dezinformuje čtenáře o retirovaných axiomech (layered bay, Flux, Kredo, food/air, VT323, WIN/LOSS, recipe per-HP rate). Jedno hodinové sezení to vyčistí.

**F2 base class je nyní dozrálý:** 4 panely × ~400 LOC se 60 % boilerplate kopie. Doporučuji **před** 5. panelem (Kolonisté [K] / Commands palette) — jinak kopíruji pátý problém.

**Doporučení pro S32:** F1 + F3 + F4 + F5 jako „kvickie cleanup" (~1.5 h), pak volba mezi F2 (4 h refactor) nebo skok do Wake-up mechanismu (R2 #1). F2 před Wake-up má ROI: Wake-up přinese 5. panel a Player mode UI.
