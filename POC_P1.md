# POC_P1.md — První proof of concept

Verze: **0.1** (2026-04-12, Sezení 6)

Minimální hratelný sim Voidspanu ve formátu **single-player puzzle** s brzkou WIN/LOSS podmínkou. Inspirace: Puzzle mód z PocketStory.

> POC_P1 **není MVP**. Je to dialogový artefakt pro P1–P4 (blízcí autora). Cíl = zjistit, zda jádro zážitku baví; ne udržet hráče.

---

## 1. Goal & hypothesis

**Goal:** Dostat na stůl nejmenší možný interaktivní artefakt, který (a) ilustruje tón Voidspanu, (b) otestuje čitelnost Energy Modelu (W/WD), (c) ověří scénář SHIP Wake-up jako onboarding.

**Hypothesis:**
> Hráč dostavší se do WIN konce řekne: *„To bylo překvapivě hutných 15 minut, chtěl bych vědět, co bude dál."*

Hráč dostavší se do LOSS konce řekne: *„Dáme ještě jeden pokus."* (Přestože mu hra restart explicitně nenabízí — jen refresh.)

---

## 2. Format

- **Single-player puzzle**, žádný multiplayer, žádný chat.
- **Jeden pokus** — po WIN/LOSS závěrečný dialog, konec. Pro další hru = refresh/restart stránky.
- **Bez brains.** Hráč dává přímé příkazy dronům/kolonistům.
- **Volatilní svět** — stav se po zavření session nepřenáší. Záloha/dump DB až v P2+.
- **Délka:** 10–20 min wall-clock (target), ladí se `TIME_COMPRESSION`.

---

## 3. World scope

**SHIP = 1 SEGMENT = 2×8 = 16 TILES.** (Revize S5 — 2. segment byl zbytečná rezerva, modulová math se vešla do jednoho.)

**Startovní rozložení modulů (14 tiles z 16, 2 volné pro stavbu):**

| Modul | Velikost | Poznámka |
|---|---|---|
| Habitat | 1×1 | 1 kolonista probuzený (hráč) |
| SolarArray | 1×1 | Napájení |
| Engine | 2×2 | **K demontáži** |
| Storage | 1×1 | Zásoby (X dní jídla/vzduchu) |
| MedCore | 1×1 | |
| Assembler | 1×1 | Výroba modulů z Kredo |
| CommandPost | 1×1 | UI root |
| `[damaged tile]` | 1×1 | **Únik vzduchu — vzniká při startu** |
| `[empty]` + `[empty]` | 2×1 | Volné tiles pro stavbu Docku 2×2 |

**Drony v poolu:** Constructor + Hauler (počty ladí kalibrace). Marshals/Medics/Fighters mimo scope.

**Kolonisté v kryo:** 7 spících v Habitats / Storage (probuzení je mimo P1 scope; hráč je 8. — Founding Colonist #1).

---

## 4. Scenario

### 4.A — Krize: Únik vzduchu

**Trigger:** ihned po probuzení hráče.
**Mechanika:** Jeden tile se rozbije, vzduch v SHIPu klesá lineárně. Hráč musí poslat Constructor(y) utěsnit.
**Timeout:** `CONST_PUZZLE_SLACK_FACTOR × optimum_repair_time` (default 2×).
**LOSS:** Vzduch → 0, všichni umírají (včetně kolonistů v kryo). Závěrečný dialog + fade.
**WIN sub-stav:** Tile opraven → scénář přechází do 4.B.

### 4.B — Normal task: Engine → Dock

**Cíl:** Demontovat Engine (2×2, 120 WD z S5) a na stejném místě postavit Docking Station (2×2).
**Narativ:** Dock umožní připojit moduly flotily, které parkují opodál (Greenhouse, další Habitat, další SolarArray — nejsou součástí P1 WIN podmínky, jen indikátor rozšíření).
**Rozpočet zdrojů (v Kredo/Echo):** ladí se tak, aby optimum bylo realizovatelné a slack factor 2× dával rezervu na omyly.
**WIN:** Dock ve stavu `docked` (= online + minimálně 1 modul flotily připojený).
**LOSS:** Zásoby jídla/vzduchu vyčerpány dřív, než je Dock hotový.

### 4.C — Volitelný bonus

Po WIN z 4.B zůstává čas do timeoutu session. Hráč může:
- Postavit 2. Habitat z Assembleru.
- Postavit 2. SolarArray.
- *(Probuzení dalšího kolonisty je mimo P1 scope.)*

Splnění C = „perfect ending" flavor text, neovlivňuje WIN/LOSS klasifikaci.

---

## 5. Mechanics in-scope

- **Energy Model W/WD** v plném rozsahu (viz GLOSSARY §Energy Model).
- **Time compression** — parametr, ladí se playtestem. Default `TIME_COMPRESSION ≈ 16×`.
- **Drone fleet** — Constructor + Hauler, kapacita W omezená SolarArray výkonem.
- **Stavební katalog:** Docking Station 2×2, Habitat 1×1, SolarArray 1×1.
- **Demontáž:** Engine (jediná demolice v P1, pevně skriptovaná).
- **Resource drain:** jídlo + vzduch klesají v čase; Storage má konečné množství.
- **UI:** text/tabulka (grafika = samostatné Art sezení).
- **WIN/LOSS dialog:** krátký závěrečný text, fade, konec.

---

## 6. Mechanics out-of-scope (explicit)

Tyto systémy **nejsou** v P1 a jejich absence není bug:

- Brains / offline scheduling
- Multiplayer, chat, komunikace
- Persistence mezi sessions
- Belt (vše za hranicí SHIPu)
- Marshals, lawlessness, justice
- Faction Hierarchy, politika, hlasování
- Event log (může se zapnout pro debug)
- Research tree, technologie
- Capsule onboarding (Founding Colonist Invitation = narativní rámec, ne mechanika)
- Greenhouse stavba (jen narativní motiv „flotily parkující za Dockem")
- Probuzení dalších kolonistů
- Entropie / decay cells
- Orbital Shift
- Monetizace (žádná)
- Modeartion, LLM
- Grafika mimo placeholder tiles

---

## 7. WIN / LOSS podmínky

**WIN:**
1. Krize 4.A vyřešena (Únik vzduchu utěsněn).
2. Engine demontován.
3. Docking Station online ve stavu `docked`.

**LOSS (kterékoli):**
- Vzduch → 0 během 4.A timeout.
- Jídlo nebo vzduch → 0 během 4.B.
- Hráč uzavře session před dokončením.

Po obou koncích: **závěrečný dialog + fade + link „refresh = nová hra"**.

---

## 8. Kalibrace

**Univerzální heuristika:**

```
CONST_PUZZLE_SLACK_FACTOR = 2
```

Pro každý timeout / budget v puzzle módu:
> `budget = 2 × optimum_provedení_s_max_nasazením_zdrojů`

Aplikuje se na:
- Délku timeoutu Úniku vzduchu (4.A).
- Zásoby jídla/vzduchu vzhledem k délce 4.B při optimálním postupu.
- Energii pro Dock stavbu (vs. kapacita SolarArray).

Konkrétní hodnoty se určují playtestem, ne dopředu.

---

## 9. Asset list

→ Viz samostatné **Art sezení** (TBD). Přehled potřebných assetů:

**Moduly (tile sprites):** Habitat, SolarArray, Docking Station, Engine, Storage, MedCore, Assembler, CommandPost, damaged tile, empty/floor.
**Aktéři:** Kolonista (idle/walk/work), Constructor drone, Hauler drone, kryo-kolonista (static).
**Flotila:** silueta-sprity parkujících modulů u SHIPu.
**VFX:** air-leak particle, build progress bar, weld/spark.
**UI:** Resource HUD, session clock, action menu, WIN/LOSS screen, module inspector.
**Audio (optional):** ship hum, alarm loop, build SFX, WIN/LOSS sting.

---

## 10. Open calibration questions

- **CAL-A1** Optimum repair time pro Únik vzduchu (kolik WD s max dronů).
- **CAL-B1** Engine demontáž: 120 WD z S5 — potvrdit vs. doladit.
- **CAL-B2** Dock 2×2 stavba: cost v Kredo + WD.
- **CAL-B3** Rychlost depletion zásob (jídlo, vzduch) vs. Storage capacity.
- **CAL-T1** Kolik `TIME_COMPRESSION` pro target 10–20 min wall.
- **CAL-D1** Počáteční pool dronů: kolik Constructor, kolik Hauler.
- **CAL-S1** SolarArray výkon (W) — kolik dronů utáhne.

Všechny se ladí playtestem, nikoli spekulací.

---

## 11. Success / Fail criteria pro P1 samotné

**P1 splnilo účel, pokud:**
- Alespoň 2 ze 4 playtestů (P1–P4) dojdou do WIN.
- Alespoň 3 ze 4 po ukončení vyjádří zvědavost na „co bude dál" (ne nutně hraním).
- Feedback zachytí ≥1 konkrétní designovou otázku, která by bez hry nevyplynula.

**P1 selhalo, pokud:**
- Většina hráčů nechápe, co má dělat (čitelnost).
- Většina hráčů dojde do WIN bez napětí (slack factor moc velký).
- Hráči zmiňují chybějící systém jako blokátor („kde je chat", „chci víc lidí") — znamená to, že single-player puzzle není správná forma POC.

---

## Reference

- `GLOSSARY.md` — Energy Model, entity, konstanty.
- `SCENARIO.md` §4.0 SHIP Wake-up — narativní rámec.
- `MINDMAP.md` — bod 3.1 (Prostor a čas), fokus 3.2 + 3.3 + Q17.
- `TODO.md` Q17 — uzavřeno tímto dokumentem.
