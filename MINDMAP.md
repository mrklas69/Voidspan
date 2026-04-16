# MINDMAP.md — ⊙ Voidspan

Myšlenková mapa projektu. Slouží k nalezení fokusu: **kde máme maso, kde díru, co je záclona a co základ**.

Aktualizuj kdykoli se změní struktura projektu (nový bod, přejmenování, přesun). Stav naplnění značí, kolik je v dané větvi skutečně rozhodnuto.

**Legenda stavu:** `[●]` plné / `[◐]` rozpracováno / `[○]` prázdno / `[✕]` zrušeno.

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

**S25 hotovo (velký refaktor):** Drone E drain (productionTick: `netPower - droneDraw - softwareDraw`). QuarterMaster hystereze 40–60% (RESUME 3 → 4). Dashboard 5-color kánon (`ratingColor(pct)` helper, `metricColor` retirement). `isProductiveTask(t)` sdílený predikát. workTooltip dedup. **Software třída** + příkon (QM v2.3 = 0.86 W; E=0 → SW offline + DRN:CRIT). **Repair recipes** (M:N reference Modul/Bay → Solids/Fluids subtypy; per-HP rate; gate na deficitu kterékoli složky s důvodem `no <subtype>`). **E infotip** moduly agregované per kind. **Kvintet rename**: Pevné/Solids (S), Tekutiny/Fluids (F) — `Slab`/`Flux` retirováno z displaye i kódu. **Resource Taxonomy** (rarity Common→Epic + logistics matrix Solids/Fluids — P2+ design baseline). **Food + Air retire (KISS)**: `solids.food` (atribut, ne kategorie) + `fluids.air` (24th-cent recyklace) odstraněny. FVP subtypy: Solids = {metal, components}, Fluids = {water, coolant}. Top Bar S/F bary = worst-of subtypů. **Memory** `feedback_lang_convention.md` (code EN, display CZ). **AUDIT:CODE + AUDIT:DOCS** pass.

**S24 hotovo:** Integrita (II.2, `entropy` → `integrity`, E vyjmuta). Protocol (GLOSSARY — AI CPU + knowledge base). Responsive Layout (KISS — fix panely, canvas = viewport, 2D pozadí). CLAUDE.md Design principy sekce. **QuarterMaster v2.3** (autopilot: E gate + kapacitní check, min-HP target, eternal monitor, cleanupOldTasks 1 h). Task lifecycle (pending/active/paused/completed/failed/eternal). Task Queue Panel [T] (5-color semafor, radio s [E]). TASK event verb (◈). Progress bar `███░░░░░░░`. W rating = availability (Censure fix — semafor sdílí metriku s ukazatelem). Bay tooltip stav tasku místo klik.

**S23 hotovo:** Tooltip barevný header. SIGN eventy barevné. Phase retirement. Kvintet infotipy. ENERGY_MAX dynamický. Work model eureka. Hauler retirement.

**S22 hotovo:** Mobile touch. Event format CZ. InfoPanel UX. Energy infotip.

**Další bagr:**
1. **Wake-up mechanismus** — v FVP všichni v cryo, per-capita drain = 0. Trigger pro probuzení (scripted event, hráčský akt). Bez něj Observer sim stagnates na survival ose.
2. **Energy=0 → cryo failure trigger** — E=0 při cryo aktérovi by měl vynutit probuzení (WAKE event) + následný HP drain homeless. SW offline už máme.
3. **Práce spotřebovává HP hráče** — progressTasks odečítá HP working aktérům.
4. **Inteligentní postranní dokování panelů** — BELT se přesune/zmenší aby zůstal viditelný při otevřeném [E]/[T]/[I]. Axiom: BELT > panel.
5. **II.2 Integrita jako rate** — přepis snapshot → Δ HP / game day (repair vs. decay).
6. **Build/demolish progrese** (zůstává z S18 split). Player mode only.
7. **Floating panel manager** — K/U/Z/E/P workspace. Globální ESC z S19 TODO.
8. **Lazy filter chips** — chip UI pro verb filtrování v EventLog.
9. **Module FX animations** — blink/fan/dish/sparks. Data-driven.

**Terminologie prototypů:** P1/P2/P3/P4 = **POC** (proof of concept), ne MVP. Cíl = dialog s blízkými, ne trh.

**Terminologie entit:** WORLD → BELT → SEGMENT → MODULE → BAY. Pojem „Cell" retirován. SHIP-Bow/Stern retirován (S6).
