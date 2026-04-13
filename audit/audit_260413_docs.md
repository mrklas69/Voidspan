# Audit Voidspan — 2026-04-13 (DOCS)

**Typ:** `@AUDIT:DOCS` — konzistence dokumentace.
**Auditor:** Claude Opus 4.6 (1M), konec sezení 12 / začátek sezení 13.
**Scope:** MINDMAP, SPECIFICATION, GLOSSARY, SCENARIO, POC_P1, IDEAS, TODO, DONE, CLAUDE.md.
**Předchozí audit:** `audit_260412.md` (po S4, prep fáze bez kódu).
**Rozsah období:** sezení 5–12.

---

## Scorecard

| KPI | S4 (260412) | S12 (260413) | Trend |
|---|---|---|---|
| Dokumentů MD v rootu | 8 | 9 (+POC_P1) | ↑ +1 |
| MINDMAP verze | v1.0 | v1.8 | ↑ +0.8 |
| MINDMAP uzly `[●]` | 22/39 (56 %) | ~28/35 (80 %) | ↑ +24 pp |
| MINDMAP uzly `[◐]` | 11/39 (28 %) | ~6/35 (17 %) | ↓ −11 pp |
| MINDMAP uzly `[○]` | 6/39 (16 %) | ~1/35 (3 %) | ↓ −13 pp |
| SPECIFICATION verze | v0.1 DRAFT | v0.1 DRAFT | — (stale) |
| SCENARIO verze | v0.3 | v0.4 | ↑ |
| GLOSSARY verze | v0.3 | v0.5 | ↑ |
| POC_P1 verze | v0.1 (S6) | v0.7 | ↑ +0.6 |
| Kód (LOC) | 0 | ~2 539 | ↑ |
| F1 (SCENARIO E1) | otevřeno | **stále otevřeno** | ⚠ |
| Celkové skóre | ★4.0/5 | **★4.2/5** | ↑ +0.2 |

**Komentář:** Projekt zdravě pokročil v implementaci (code + POC_P1). **Formální dokumentační synchronizace ale zaostala** — SPECIFICATION neaktualizován od S4, SCENARIO legacy neodklizený. F1 ze starého auditu stále blokátor pro P2+.

---

## FINDINGS

Legenda: `[CRIT]` · `[MAJ]` · `[MIN]` · `[INF]`.

### F1 `[CRIT]` — SCENARIO.md paralelní struktury (z S4, stále otevřeno)

**Stav:** NEVYŘEŠENO.
**Detail:** SCENARIO §2C (Player Arc draft), §2D (Session Arc draft) vs. §2.LEGACY + §3–§13 (Act -1 až Post-Closure). Čtenář neví, co je platné. Network Arc §2A prázdný.
**Impact:** Blokátor pro P2+ implementaci. SPECIFICATION §10.1 E1 to stále flagguje.
**Akce:** Refactor — legacy do přílohy `SCENARIO-legacy-v0.3.md`, §2 čistý arc index s linky na §2A–2D. Scope: 1 sezení.

### F2 `[MAJ]` — Resource Model v0.1 není propagován

**Stav:** ČÁSTEČNĚ.
**Detail:** GLOSSARY v0.5 čistě definuje 5-os model `{E, W, S+food, F+air, ◎}`. Ale:
- **SPECIFICATION §4.5** stále říká „Echo (solární palivo) … Kredo (stavební zdroj)".
- **IDEAS §Ekonomika** zmínka „Dva zdroje: Echo, Kredo".
- **POC_P1 §10** používá `food/air/kredo` bez odkazu na Slab.food / Flux.air / Coin.
**Impact:** Čtenář pokládá za kánon starý model.
**Akce:** Search & replace `Echo`/`Kredo` → `Coin`/`Energy` napříč MD. Update SPECIFICATION §4.5 a IDEAS §Ekonomika.

### F3 `[MIN/MAJ]` — POC_P1 §16 vs. UI Layout axiom

**Stav:** ROZPOR.
**Detail:** POC_P1 §16 popisuje 3-bar HUD (Air/Food/Kredo). GLOSSARY §UI Layout axiom požaduje 5-bar (E/W/S/F/◎). MINDMAP v1.8 tvrdí „Top Bar 5 resource bars" — to je stav kódu, ne POC_P1.
**Impact:** Minor pro P1, strukturní pro P2+.
**Akce:** Ujasnit v POC_P1 §16 scope: „P1 = 5 bar dle axiomu, P1 hodnoty seed v §10".

### F4 `[MAJ]` — DONE.md S9 odkazuje na neexistující soubor

**Stav:** NEAKTUÁLNÍ ZÁZNAM.
**Detail:** DONE.md S9 tvrdí, že `src/game/format.ts` existuje jako „jediný zdroj pravdy". **Ale `format.ts` byl reálně vytvořen až v S12** (axiom + 9 testů). Záznam DONE je z S9, kdy soubor neexistoval.
**Impact:** Historie je zmatečná; forward reference.
**Akce:** Opravit DONE.md S9 záznam (přesunout implementaci do S12).
**Poznámka:** CODE audit potvrzuje, že format.ts existuje a je compliant — to je OK. Chyba je jen v DONE.md chronologii.

### F5 `[MIN]` — Tenety T1–T4 tónová nekonzistence v SCENARIO

**Stav:** DROBNÝ ROZPOR.
**Detail:** GLOSSARY + SPECIFICATION + IDEAS korektně označují T1–T4 jako **kandidáty**. SCENARIO §1.1 je ale píše jako pevný axiom („Herní mechaniky mají odměňovat…"). 
**Akce:** SCENARIO §1.1 upravit na „Design kompas (T4 kandidát — Forgiveness rewarded): …".

### F6 `[MAJ]` — TODO.md vs. DONE.md desynchronizace

**Stav:** ROZPTYL.
**Detail:** TODO zachovává R1/R2/R3 jako meta-revize (víc deliverables v jedné položce). Některé Q-otázky z POC_P1 (Q-P1-*) jsou uzavřené v TODO, ale chybí čítelný link na POC_P1 sekci, která je uzavírá. R1 Multi-colony je velký úkol bez rozdělení.
**Akce:**
1. Rozdělit R1/R2/R3 na dílčí úkoly.
2. Re-triage Q-otázek: blokátor P1 vs. P2+.

### F7 `[MIN]` — Orphan pojmy vyčištěny, zbytky v SCENARIO legacy

**Stav:** ČISTÝ mimo legacy.
**Detail:** Cell/SHIP-Bow/Stern retirovány ✓. „Act -1 / Act 0" stále žije jen v SCENARIO §2.LEGACY — bude odstraněno s F1.
**Akce:** Zahrnuto v F1.

### F8 `[INF]` — Cross-refs na SCENARIO sekce validní

**Stav:** OK.
**Detail:** GLOSSARY odkazuje na SCENARIO §4 a §12 — obě sekce existují (§11 Monetization, §12 Recruitment, §13 Citizen tiers).

### F9 `[INF]` — Brains koncept správně distribuován

**Stav:** OK.
**Detail:** IDEAS (core definice), SPECIFICATION §4.3 (souhrn), POC_P1 §15 (task-oriented input jako seam pro P2+ brains). Bez duplikace.

### F10 `[MAJ]` — CONST_* mapping GLOSSARY ↔ POC_P1 §10

**Stav:** NEJASNÉ MAPOVÁNÍ.
**Detail:** GLOSSARY §Design Constants má 13 konstant (6 TBD). POC_P1 §10 Seed kalibrace má 8 parametrů. Chybí explicitní: „POC_P1 seed hodnoty jsou P1-lokální, ne dědičné z GLOSSARY konstant".
**Akce:** POC_P1 §10 heading → „Seed kalibrace (P1-lokální, ne CONST_* z GLOSSARY)". Přidat mapping tabulku.

### F11 `[MAJ]` — SPECIFICATION v0.1 DRAFT neaktualizován 8 sezení

**Stav:** STALE.
**Detail:** SPECIFICATION z S4 obsahuje seznam GAPs/ERRORs, který se částečně uzavřel (Q-World-1, Q-P1-Arch, Q-P1-Telemetry, Q-P1-Input, Q-P1-Character, Q-P1-Tick, Q-P1-UI, Q-P1-Onboarding, Q-P1-Dialogs, Q-Player-Schema, Q-P1-Character, Q11, Q13…). SCENARIO v0.4 (S6) nezachycuje arcs work z S7–S12. POC_P1 v0.7 (S7) nezachycuje S8–S12 (skeleton hotov, axioms v GLOSSARY).
**Akce:** SPECIFICATION → v0.2 s S12 snapshot (co se uzavřelo, co remains). POC_P1 → v0.8.

### F12 `[MIN]` — Gramatika a tón

**Stav:** OK.
**Detail:** Spot check: český jazyk konzistentní, terminologie stabilní, tón POC_P1 suchý/diegetický správně. Bez detailního copyeditu ale nevíme o typech.

### F13 `[MIN]` — Session log data nejasná

**Stav:** HYGIENA.
**Detail:** `.claude/sessions/2026-04-12.md` vs `2026-04-13.md` — zda všechna sezení S7–S12 proběhla reálně 2026-04-13 je nejasné.
**Akce:** Na `@END` čistit headers na reálné datumy.

---

## Trendy vs. audit S4

| Metrika | S4 | S12 | Změna |
|---|---|---|---|
| Findings identifikováno | 11 | 13 | ↑ |
| Findings vyřešeno od S4 | — | F2 old, F3 old, F5 old, F7 old, F11 old → 5 z 11 vyřešeno | ↓ otevřených |
| SPECIFICATION GAPs | 11 | ~5 reálně otevřených (ne odráženo v dokumentu) | ↓ |
| Kód LOC | 0 | 2 539 | ↑ |
| Paralelní SCENARIO (E1) | otevřeno | stále otevřeno | — |
| Terminologická čistota | 4 stale refs | Cell/SHIP vyčištěno; Echo/Kredo reziduum | ↓↑ mix |

---

## Akční body

### Kritické (blokátory) — okamžitě
1. **F1** — refactor SCENARIO.md (legacy do přílohy, §2A–2D čistý). Vlastní sezení.

### Významné — tento týden
2. **F2** — sweep Echo/Kredo → Coin/Energy v SPECIFICATION §4.5, IDEAS §Ekonomika.
3. **F6** — triage TODO: rozdělit R1/R2/R3, re-klasifikovat Q-otázky P1/P2+.
4. **F10** — mapping CONST_* ↔ POC_P1 §10 seed.
5. **F11** — SPECIFICATION v0.2 snapshot, POC_P1 v0.8.

### Kosmetické
6. F3 — POC_P1 §16 scope clarifikace.
7. F4 — DONE.md S9 chronologie.
8. F5 — SCENARIO §1.1 T4 kandidát tón.
9. F13 — session log dates.

---

## Cadence

- **`@AUDIT:DOCS`** po každé revizi (R*) nebo refactoru MD souboru; jinak 1× za 4–5 sezení.
- **`@AUDIT:CODE`** po milníku (další audit až `apps/client/src` ≥ 5 kLOC, nebo po Resource Model refactoru).
- **Version bumps:** SPECIFICATION v0.2 po F2+F11, SCENARIO v0.5 po F1.

---

## Závěr

**Skóre ★4.2/5** (+0.2 vs. S4). Projekt je ve zdravé fázi s řádnou technickou hloubkou. Hlavní dluhy jsou **administrativní**, ne designové: F1 (SCENARIO legacy) je známý blokátor, F2 (Resource Model propagace) a F11 (stale SPECIFICATION) jsou rychlé fixy. Bez strukturního refactoru F1 není P2+ implementace čitelná.
