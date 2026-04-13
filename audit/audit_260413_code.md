# Audit Voidspan — 2026-04-13 (CODE)

**Typ:** `@AUDIT:CODE` — terminologie, architektura, kvalita, soulad se záměrem.
**Auditor:** Claude Opus 4.6 (1M), konec sezení 12 / začátek sezení 13.
**Scope:** `apps/client/src/`, `scripts/`, `package.json`, `vite.config.ts`, `tsconfig.json`.
**Verze kódu:** 0.5.0. **Testy:** 40/40 zelených (Vitest).
**Předchozí CODE audit:** žádný (tento je první).

---

## Scorecard

| Metrika | Hodnota | Stav |
|---|---|---|
| LOC (src/game) | 2 539 | ✓ čisté |
| Počet TS souborů | 14 | ✓ dobrá granularita |
| Test files | 3 (40 testů) | ✓ 40/40 zelených |
| TS strict | vynucen | ✓ clean build |
| Axiomy OK | 7/9 | ⚠ 2× MAJOR debt |
| Komentáře česky | 100 % | ✓ |
| Build warning | chunk size 1500 kB | ℹ ignorable (POC) |

---

## Axiomy — soulad

| # | Axiom | Stav |
|---|---|---|
| 1 | Resource Model v0.1 | ❌ DEBT — kód na starém `{air, food, kredo}` |
| 2 | formatScalar (2 sig, SI) | ✅ OK |
| 3 | UI Layout (3 zóny + 5 floating) | ⚠ partial (3 zóny OK, floating panels chybí) |
| 4 | Font preload VT323 | ✅ OK |
| 5 | Hotkeys case-insensitive | ❌ missing |
| 6 | Model-first architektura | ✅ OK |
| 7 | Magenta keying (assets) | ℹ N/A (assets mimo repo scope) |
| 8 | Task engine §15 | ⚠ KISS (jen repair task) |
| 9 | FSM data model §13–14 | ✅ OK |

---

## FINDINGS

### F1 `[CRIT]` — Starý Resource Model v kódu

**Stav:** DEBT.
**Detail:** GLOSSARY v0.5 deklaruje nový model `{Energy E, Work W, Slab S (+food), Flux F (+air), Coin ◎}`. Kód používá starý `{air, food, kredo}`.

Klíčová místa:
- `apps/client/src/game/world.ts:74` — `resources: { air: 100, food: 40, kredo: 20 }`
- `apps/client/src/game/GameScene.ts:733` — Inspector zobrazuje `${def.cost_kredo} Kredo`
- `model.ts` — property `cost_kredo` na `Module` definici

**Impact:** Hlavní axiom deklarovaný, ale neimplementovaný. HUD ukazuje zastaralou terminologii. Kolize při P2+.

**Akce — refactor:**
```typescript
resources: {
  energy: { current: number, max: number },
  work:   { current_pool: number },
  slab:   { food: number, metal?: number },
  flux:   { air: number, water?: number },
  coin:   number,
}
```
+ přejmenovat `cost_kredo` → `cost_coin`, update HUD tooltips, ~2 h, +3 testy.

### F2 `[MAJ]` — Hotkeys nejsou case-insensitive

**Stav:** AXIOM VIOLATION.
**Detail:** `GameScene.ts:483–493` váže `keydown-R`, `keydown-E`, `keydown-W`, `keydown-L` — bez `.toLowerCase()`. Hráč s CapsLock / Shift → klávesa nefunguje. Memory `feedback_hotkeys_case.md` to explicitně zakazuje.

**Bonus:** Floating panels K/U/E/P/Z z UI Layout axiomu nejsou ani na keybind mapě.

**Akce:** Přepsat na unified `keydown` handler s `event.key.toLowerCase()`. ~1 h.

### F3 `[MAJ]` — GameScene.ts nabobtnalá (748 LOC)

**Stav:** STRUCTURAL DEBT.
**Detail:** Monolitická scéna — createHeader, renderHeader, renderSegment, renderActors, renderTaskQueue, renderInspector, selectTile, tooltip attach, modal, background scroll v jedné třídě. 50 % game kódu.

**Impact:** KISS/SLAP rozmazané. Budoucí build UI / demolish / docking animation bude dál nafukovat.

**Akce (sekvenčně):**
1. `HeaderPanel` → `ui/header.ts`
2. `SegmentPanel` → `ui/segment.ts`
3. `ActorsPanel` → `ui/actors.ts`
4. GameScene = orchestrator, ne implementátor.

~4 h. Odměna: testovatelnost, reuse.

### F4 `[MIN]` — Tooltip CSS type assertion

**Stav:** CODE SMELL.
**Detail:** `tooltip.ts:73–78` používá `as unknown as { … }` cast pro "ensureInteractive" fallback. Indikuje absence korektního Phaser type.

**Akce:** Vytvořit helper type `InteractiveGameObject`. P2 backlog.

### F5 `[MIN]` — Kredo v HUD textu

**Stav:** TERMINOLOGIE (pokryto F1 refactorem).
**Detail:** HUD tooltip (`GameScene.ts:219–224`) mluví o "Coin [◎] — měna", ale Inspector (l.733) ukazuje "Kredo". Smíšená terminologie.

**Akce:** Součást F1 refactoru.

### F6 `[INF]` — Font preload axiom OK

**Stav:** COMPLIANT.
**Detail:** `main.ts:27–46` volá `document.fonts.load("16px VT323")` PŘED `new Phaser.Game()`. Fallback error handler. Memory `feedback_font_preload.md` dodržena.

### F7 `[INF]` — formatScalar axiom excellent

**Stav:** FULLY COMPLIANT.
**Detail:** `format.ts` implementuje 2-sig-digit SI prefix dokonale. `format.test.ts` pokrývá hranice (999→1.0k bump, µ/m/k/M/G/T). 9 testů zelených.

### F8 `[MIN]` — UI Layout axiom partial

**Stav:** PARTIAL.
**Detail:** 3 zóny (Top/Mid/Bottom) OK. 5 floating panels K/U/E/P/Z **chybí** — aktuálně fixní Actors (left), TaskQueue/Inspector (right). Help dialog neukazuje K/U/E/P/Z.

**Akce:** Až přijde FloatingPanelManager (MINDMAP fokus #2), přidat hotkey binding.

### F9 `[MIN]` — Task engine §15 minimalistický

**Stav:** WORKING, KISS.
**Detail:** `world.ts:84–145` — jen repair task, žádný build/demolish/haul. Auto-assign idle actors bez priority sortu, žádná actor saturation. Lineární WD progress dle `Σ power_w`.

Fundamentálně správně (model-first, enqueue idempotent). Málo testů nad task engine specificky — pokryto jen přes FSM scénáře.

**Akce:** P2 — rozšířit na build/demolish/haul + priority queue.

### F10 `[INF]` — Model-first architektura excellent

**Stav:** COMPLIANT.
**Detail:** `model.ts` = typy, `world.ts` = logika (čistá, bez Phaser), GameScene = view. Scény se nepropojují přímo. FSM (`startGame`, `repairDone`, `dockComplete`, `endDay`) = separátní funkce, testovatelné solo. Budoucí save/load/replay snadný.

### F11 `[INF]` — Komentáře česky 100 %

**Stav:** COMPLIANT.
**Detail:** File headers, sekce, logika — všechno česky. Globální CLAUDE.md splněn.

### F12 `[MAJ]` — Test pokrytí: moduly ano, scéna ne

**Stav:** INCOMPLETE.
**Detail:**
- ✓ `format.test.ts` — 9 testů, kompletní.
- ✓ `model.test.ts` — 12 testů, katalog invariants (FK, asset naming, power_w).
- ✓ `world.test.ts` — 19 testů, FSM + drain + loss.

Chybí: `GameScene.test.ts` (smoke test, Phaser mock). UI panely bez unit testů.

**Akce:** Součást F3 refactoru — panely po extrakci testovatelné.

### F13 `[INF]` — Magenta keying pipeline N/A

**Stav:** NEOVĚŘENO.
**Detail:** `scripts/key-transparency.ps1` existuje. Assets v repo jen placeholder (solar_array.png). Pipeline axiom nelze ověřit bez reálných assetů.

---

## Kvantitativní shrnutí

| Kategorie | Počet | Priorita |
|---|---|---|
| CRIT | 1 (F1) | 🔴 blocker |
| MAJ | 3 (F2, F3, F12) | 🟠 this sprint |
| MIN | 4 (F4, F5, F8, F9) | 🟡 P2 backlog |
| INF | 5 (F6, F7, F10, F11, F13) | ✓ OK |

---

## Priorizovaný akční seznam

### Sprint NYNÍ (před další POC_P1 iterací)

1. **[CRIT] F1 — Resource Model refactor** (`world.ts:74`). ~2 h, +3 testy. Unblocker.
2. **[MAJ] F2 — Case-insensitive hotkeys** (`GameScene.ts:483`). ~1 h.
3. **[MAJ] F3 — Rozdělit GameScene** na Header/Segment/Actors panely. ~4 h. Odměna: testovatelnost.

### Backlog P2
4. [MIN] F5 — `cost_kredo` → `cost_coin` (součást F1).
5. [MIN] F4 — Tooltip type safety.
6. [MIN] F12 — GameScene.test.ts smoke.
7. [MIN] F9 — Task engine expand (build/demolish/haul + priority).
8. [MIN] F8 — Floating panels K/U/E/P/Z hotkeys (po FloatingPanelManager).

---

## Závěr

Projekt je **strukturálně zvládnutý**: model-first architektura čistá, testy zelené, TS strict bez únikuů. Nese **1 kritický design debt** (starý resource model — axiom bez implementace) a **2 structural issues** (monolitická GameScene, chybějící hotkey feature). V herní logice žádné bugy — FSM správná, drain sedí, testy drží.

**Doporučení:** F1 + F2 IHNED (1 sezení). F3 další sezení. Pak lze bez obav rozšiřovat do P2 (build menu, modules, dialog système).
