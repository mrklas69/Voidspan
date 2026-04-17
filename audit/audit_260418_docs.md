# Audit Voidspan — 2026-04-18 (DOCS)

**Typ:** `@AUDIT:DOCS` — úplnost, konzistence, jazyková korektura, struktura.
**Auditor:** Claude Opus 4.7 (1M), sezení 33.
**Scope:** root `.md` soubory + `.claude/memory/*.md`. Session logy a dříve retirované audit soubory vynechány.
**Verze:** 0.9 (FVP Observer Edition).
**Předchozí DOCS audit:** `audit_260413_docs.md` (verze 0.4, S14, před 5 dny — ale 18 sezeními).

---

## Shrnutí

Dokumentace se rozpadá na **dvě vrstvy**:

- **Aktuální vrstva** (MINDMAP v4.0, GLOSSARY v1.4, IDEAS S32+) — drží krok s kódem, S32/S33 změny promítnuty.
- **Stará vrstva** (SPECIFICATION z S14, TODO s Q-P1 historií, SCENARIO s Appendix cross-refs) — nebyla aktualizována po S25 Resource Model pivotu ani S32 POC_P1 retire.

**Hlavní systémové nálezy:**
1. **POC_P1.md** byl smazán v S32, ale **16+ odkazů** v 5 dokumentech zůstalo.
2. **SPECIFICATION.md §4.5** používá retirované `Slab/Flux/Kredo` + `food/air` subtypy (S25 kánon říká jinak).
3. **GLOSSARY.md II.1 runway metrika** mluví o `food_days/air_days/water_days` — food + air retirovány v S25.
4. **PLAYTEST_GUIDE.md** (public!) má 2 chyby: `skeleton/covered` (S28 retire) + `REPR` verb (S31 retire).

---

## Nálezy per soubor

### SPECIFICATION.md `[CRIT]`
**Poslední update:** S14 (2026-04-13). **17 sezení zastarala.**

- **§4.5 ř. 139–141** — `Slab (S)`, `Flux (F)`, `Coin (◎)`. Slab/Flux retired S25, dnes Solids/Fluids (CZ: Pevné/Tekutiny).
- **§4.5 ř. 139–140** — subtypy `food, metal, components` / `air, water, coolant`. Food + air retired S25 KISS; metal/components/water/coolant parkoviště P2+.
- **§4.5 ř. 143** — „P1 scope používá jen `Slab.food`, `Flux.air`, `Coin` (viz `POC_P1.md` §10)." — vše retired + broken link.
- **Další POC_P1 refs** — grep hlásí víc míst, celkově dokument nesynchronizovaný s v0.9.

**Fix:** Přepsat §4.5 na aktuální FVP kánon (2 ploché resources + Coin placeholder, subtypy P2+). POC_P1 odkazy smazat / nahradit link na MINDMAP / GLOSSARY.

### GLOSSARY.md `[MAJ]`
**Poslední update:** S25+ (v1.4, průběžně).

- **ř. 45** — *„`air = 0` neznamená konec simulace; znamená že aktéři ztrácejí HP (dusí se)."* → air retired S25. Věta jako ilustrace axiomu Perpetual Observer — přepsat na neutrální příklad.
- **ř. 208** — *„II.1 Zásoby kolonistů (vzduch, voda, jídlo — runway + trend)"* → retired subtypy.
- **ř. 230** — *„II.1: `min(food_days, air_days, water_days)` do 0 při current drain rate."* → subtypy neexistují. Dnes: `min(solids_days, fluids_days)`.
- **ř. 429, 444** — `fluids.air` retire komentáře legitimní (historický kontext, OK).
- **ř. 772, 789, 806** — `Solids.food`, `Fluids.air` v UI popisu — retired subtypy.
- **ř. 800–806** — Floating Panels tabulka s hotkeys **K/U/E/P/Z**. Dnes v0.9: **I/M/E/T/Q + H**.

**Fix:** Bulk update §Status tree II.1 + §UI Layout Floating Panels. Tabulka přepsaná na aktuální panely.

### PLAYTEST_GUIDE.md `[MAJ]`
**Poslední update:** v0.9 (ale text ze S26).

- **ř. 21** — *„volná pole (skeleton / covered)"* → layered bay retired S28. Dnes jen `void`.
- **ř. 22** — *„`REPR` = oprava"* → retired S31. Dnes: `TASK` lifecycle, `CMPL` dokončení, `ASSN` přiřazení.
- **ř. 22** (ostatní verbs) — SIGN/DECY/TASK OK, REPR retired.
- **Gramatika ř. 14** — *„Jak dlouho"* bez slovesa. Typo / neúplná věta. Fix: *„Jak dlouho to trvá?"* nebo *„Čas hraní:"*.
- **Panely ř. 23–25** — `[M]` Moduly, `[I]` Stav, `[T]` Úkoly — OK. Chybí `[Q]` Query terminal (S32 nový).

**Fix:** Aktualizovat ř. 21–22, doplnit `[Q]` popis, fix typo ř. 14.

### TODO.md `[MAJ]`
**POC_P1 refs (broken links):** ř. 24, 44, 90, 97, 125, 193, a další.

- Velká část Q-P1-* check-boxů ([x]) je historicky resolved — info migrovat odkaz na MINDMAP / GLOSSARY místo smazaného POC_P1.md.
- **ř. 24** — *„POC_P1 §18 WIN/LOSS dialogy"* — retired S23. [x] OK, ale odkaz broken.
- **ř. 44** — *„Layer 3.5 Floating workspace (K/U/Z/E/P) — odloženo, viz spec v `POC_P1.md` §16"* → hotkeys retired (I/M/E/T/Q), link broken.
- **ř. 193** — *„P1 POC — Single-player puzzle"* s link POC_P1.md. Retired S20/S21 pivotem na Perpetual Observer.
- **CAL-* sekce ř. 111–121** — P1 kalibrační čísla (Únik vzduchu, Engine→Dock). Retired scenario.

**Fix:** Smazat/přesunout do DONE archivu všechny [x] s POC_P1 odkazy. Otevřené [ ] s P1 refs přepsat na Release 2 nebo smazat.

### DONE.md `[MIN]`
- Řádky 150, 152, 226, 239, 260, 273, 284 obsahují POC_P1 citace jako historický záznam. Smazat není nutné (DONE je archiv), **ale přidat poznámku na začátku souboru** — „POC_P1.md byl retirován v S32, odkazy níže jsou historické".

### IDEAS.md `[MIN]`
- **ř. 68–70** — hotové položky v sekci QuarterMaster upgrade path (WIN/LOSS přepsat jako events) — retired S21/S23. Přesunout do DONE nebo smazat.
- POC_P1 refs zkontrolovat, aktualizovat link → MINDMAP.

### SCENARIO.md `[MIN]`
- **ř. 117, 178** — *„Appendix A/B historicky 'Act -1' / 'Act 0' zachováno pro kontinuitu cross-refs"* → cross-refs v POC_P1.md jsou mrtvé (soubor smazán). Appendix má smysl jen jako historický kontext — nechat, ale doplnit poznámku.
- **ř. 189, 192** — reference na P1 scope + Únik vzduchu — historicky OK, ale parafrázovat (Perpetual Observer je aktuální kontext).

### MINDMAP.md `[MIN]`
- Verze timestamps v3.x–v4.0 nekonzistentní formát (některé s datem + sezením, jiné jen sezení). `v3.2` ř. 52 chybí datum.
- Jinak aktuální po S32.

### art/README.md `[MIN]`
- POC_P1 odkaz.

### `package.json`, `index.html`, `vite.config.ts`, `style-guide.html` `[INFO]`
- `grep POC_P1` match — ale `package.json.description` říká „(POC_P1)" — retirovat na „(FVP Observer)".
- `main.ts`, `index.html`, `vite.config.ts`, `style-guide.html` — grep možná false-positive (P1 v různém kontextu). Ověřit ručně.

---

## Priority oprav

**[CRIT] — PŘED playtestem P1–P4**
1. PLAYTEST_GUIDE.md — 2 chyby + `[Q]` panel + gramatika (5 min).
2. SPECIFICATION.md §4.5 Resources rewrite (10 min).

**[MAJ] — tento týden**
3. GLOSSARY.md — II.1 runway + Floating Panels tabulka (15 min).
4. POC_P1 bulk cleanup napříč soubory (20 min).
5. TODO.md — CAL-* retire, Q-P1-* migrace.

**[MIN] — hygiena**
6. DONE.md — historická poznámka o POC_P1.
7. IDEAS.md — hotové položky migrace.
8. SCENARIO.md — Appendix cross-ref cleanup.
9. MINDMAP.md — verze timestamp formát.
10. `package.json` description.

**Odhad celkem:** ~90 minut.

---

## Závěr

Dokumentace má jednu velkou díru (SPECIFICATION stagnace po S14) a jeden široký refactoring debt (POC_P1 retire cleanup). Ostatní dokumenty jsou mostly aktuální — GLOSSARY má lokální drift v II.1 + UI layout sekci, PLAYTEST_GUIDE má 2 zachycené chyby.

**Doporučení:** Toto sezení opravit všech 10 bodů (předem odhadnuto 90 min, rozpočet dodržet). Po fixu je docs v **release state** pro playtest.
