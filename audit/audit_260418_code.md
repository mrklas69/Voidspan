# Audit Voidspan — 2026-04-18 (CODE)

**Typ:** `@AUDIT:CODE` — terminologie, architektura, kvalita, soulad se záměrem.
**Auditor:** Claude Opus 4.7 (1M), sezení 33.
**Scope:** `apps/client/src/`, `package.json`, `tsconfig.json`.
**Verze kódu:** 0.9 (FVP Observer Edition — Perpetual). **Commit:** `9c3be02` (S32 @END).
**Testy:** 101/101 zelených (Vitest 2.1.9). **TS strict:** clean.
**Předchozí CODE audit:** `audit_260417_code.md` (verze 0.8, S31 @END).

---

## Scorecard

| Metrika | Dnes | Vs. 04-17 (S31) | Stav |
|---|---|---|---|
| LOC src/game (bez testů + main.ts) | ~5 975 | -2 % (6 092 → 5 975) | ✓ FloatingPanel konsolidace drží |
| Max LOC v 1 souboru | 467 (`model.ts`) | = | ✓ SLAP drží (katalog) |
| TS souborů src/game | 41 | = | ✓ |
| Testy | 101 | = | ✓ 101/101 zelených |
| Test LOC / src LOC | ~17 % | = | ⚠ cíl 30 % (Release 2) |
| TS strict | clean | = | ✓ |
| `as unknown as` | 3 (1 src + 2 test) | = | ✓ všechno legit |
| `console.*` v src | 0 | = | ✓ |
| Hex literály mimo palette | 0 | = | ✓ |
| Komentáře česky | 100 % | = | ✓ |
| Axiomů drží | 13/13 | = | ✓ |

**Shrnutí:** Od S32 žádný větší růst. S33 drobné: `buildTerminalBody(w)`, modal cursor + font swap PANEL→SIDEPANEL. TS + testy bez regrese.

---

## Vyřešeno od 04-17 (S32–S33)

| # | Issue | Sezení | Pozn. |
|---|---|---|---|
| F1 | Stale komentáře (14 míst) | S32 | layered bay, Flux, Kredo, food/air, VT323, WIN/LOSS, recipe per-HP |
| F2+F7 | `FloatingPanel` base class | S32 | −442 LOC boilerplate, 4 panely migrovány |
| F3 | `iconText` dead field | S32 | InfoPanel |
| F4 | `SEVERITY_COLOR` type narrowing | S32 | `Record<EventSeverity, string>` |
| F5 | `SEED_DRONES` magic number | S32 | tuning.ts §7 |
| F6 | `appendEventLog` slot retire | S32 | pipeline 12 → 11 slotů, in-place |
| — | Query terminal `buildTerminalBody(w)` | S33 | runtime substituce placeholderů {E/W/S/F} |
| — | Modal cursor + SIDEPANEL font | S33 | font sjednocen s bočními panely |

---

## Nové dluhy

### F1 [MIN] — `FloatingPanel` bez `destroy()` / listener cleanup

`ui/floating_panel.ts` base class nemá `destroy()` metodu, která by odpojila scene-level listenery. Podtřídy (InfoPanel, ModulesPanel, EventLog, TaskQueue) registrují `scene.input.on("pointermove" | "pointerup" | "wheel")` bez off při shutdown. Dnes OK — GameScene je singleton, scene lifecycle se nerotuje. Release 2 risk: pokud se scéna znovu vytvoří (future multi-scene), listenery se akumulují.

**Fix:** `FloatingPanel.destroy()` s `scene.events.once(SHUTDOWN, () => this.destroy())` registrací v ctor. ~30 min.

### F2 [MIN] — `terminal.ts` magic strings

`buildTerminalBody()` hardcoduje `"32 kolonistů v kryo"` a `"Teegarden.Belt1.Seg042"`. První hodnota by měla čerpat ze `SEED_CREW_CRYO` (tuning.ts §7), druhá z budoucí `WORLD_ADDRESS` konstanty.

**Fix:** `${SEED_CREW_CRYO} kolonistů v kryo`, `SEGMENT_ADDRESS = "Teegarden.Belt1.Seg042"` konstanta. ~10 min.

### F3 [MIN] — `modal.ts` lokální layout konstanty

`modal.ts:23-30` drží `PANEL_W_1COL = 520`, `PANEL_W_2COL = 720`, `PADDING = 24` lokálně. Při budoucí změně modal layoutu není central tune point.

**Rozhodnutí:** **Nechat** — modal-local konstanty jsou OK (panel_helpers.ts má pro panely, modal má své). `tuning.ts` je pro gameplay kalibraci, ne UI layout. DRY by byl premature.

### F4 [MIN] — `palette.ts:108` stale „LOSS" komentář

```ts
export const UI_STATUS_ALERT   = HEX_ALERT_RED;         // LOSS, damaged, fatal
```

`LOSS` jako Phase bylo retirováno v S20 (Perpetual Observer axiom). Komentář dezinformuje.

**Fix:** `// DEAD:CRIT, damaged, fatal`. ~1 min.

### F5 [INFO] — Axiom #11 (HP-unified damage) stále neúplný

Repair větev OK, build/demolish čekají na commands palette (Release 2 #3). Bez kódu teď.

---

## Axiomy — soulad

| # | Axiom | Stav 04-17 | Stav 04-18 |
|---|---|---|---|
| 1 | Resource Model (FVP KISS) | ✅ | ✅ |
| 2 | formatScalar (2 sig, SI) | ✅ | ✅ |
| 3 | UI Layout (3 zóny + 4 floating) | ✅ 4/5 | ✅ 4/5 (K Kolonisté chybí) |
| 4 | Font preload | ✅ | ✅ (Atkinson Hyperlegible) |
| 5 | Hotkeys case-insensitive | ✅ | ✅ |
| 6 | Model-first architektura | ✅ | ✅ (world/ bez Phaser importu) |
| 7 | Magenta keying | ℹ N/A | ℹ N/A |
| 8 | Task engine §15 | ✅ | ✅ |
| 9 | FSM data model | ✅ | ✅ |
| 10 | 16-color paleta | ✅ | ✅ |
| 11 | HP-unified damage (S16) | ⚠ repair only | ⚠ build/demolish čeká |
| 12 | Indikátor=barva metriky (S25) | ✅ | ✅ |
| 13 | Code EN / display CZ (S25) | ✅ | ✅ |

**Skóre:** 12/13 ✅, 1/13 ⚠ (F11 — čeká na Release 2).

---

## Závěr

Kód ve zdravém stavu. S32 uklidil 6 dluhů z auditu S31, S33 jen drobné UX. Nové nálezy jsou kosmetické (F1 listener safety, F2 magic strings, F4 stale comment). **Není žádný blokátor pro playtest.**

Doporučení na tomto sezení: **F2 + F4** (rychlé, koncepčně čistí). **F1** posunout do Release 2 pre-work, **F3** zamítnout jako premature DRY, **F5** počká.
