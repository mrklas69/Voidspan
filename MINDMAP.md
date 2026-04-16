# MINDMAP.md — ⊙ Voidspan

Myšlenková mapa projektu. Slouží k nalezení fokusu: **kde máme maso, kde díru, co je záclona a co základ**.

Aktualizuj kdykoli se změní struktura projektu (nový bod, přejmenování, přesun). Stav naplnění značí, kolik je v dané větvi skutečně rozhodnuto.

**Legenda stavu:** `[●]` plné / `[◐]` rozpracováno / `[○]` prázdno / `[✕]` zrušeno.

Verze: **v3.6** (2026-04-17, konec sezení 28 — **Code audit + 6 cleanups + 2 retire + dokovací MVP**. @AUDIT:CODE první od 04-13 (`audit/audit_260416_code.md`). F1 extrakce `world.ts` (1166 LOC) → `world/` (14 souborů, max 195 LOC). F4/F6 type helper + UI_MASK_WHITE. F5 globální ESC priority chain. F2 lightweight DRY (panel_helpers). F3 logic-only smoke testy 53→88. **Asteroid system retire** (orbit.ts smazán, IDEAS sekce). **Drift 7→30** + **damage 3→1** (START_DAMAGE_HP_RATIO). **Layered bay axiom retire** (skeleton/cover smazáno, Bay union zúžen na void/module_root/module_ref, BAY_DEFS retired, side_right.ts dead code smazán). **Loď kompaktní** — 8 modulů (Hab + 2× Sol + Med + Ass + CP + 2× Sto) přilepených k motoru (cols 2-5), 4 void vlevo. **BrandIcon ⊙** Phaser Graphics (font-independent, vrací S27 ASCII fix). **Bottom Bar** mezery odebrány. **Font 3-level konsolidace** — 11 konstant → 3 (CHROME 24 / PANEL 22 / TIP 20). **T: prefix split** (formatGameTime / formatGameTimeShort). **ModulesPanel UX** — repair branch retire + Stav modulů 5color rating header. **Dokovací MVP** — DockManager + BELT re-centering (axiom „BELT vždy viditelný; panel ustupuje, ne naopak"). 88/88 testů zelených.)

Verze: **v3.5** (2026-04-16, konec sezení 27 — **Font glyph fallback fix** (MINDMAP „Další bagr" #12 ✅). VT323 latin-subset z Google Fonts nemá geometric/dingbats/exotické arrows → browser fallback rozbíjel baseline. KISS ASCII substituce napříč rendered code: events.ts VERB_CATALOG (24 entries: ◉→`*`, †→`x`, ▽→`v`, ↘→`\`, →→`>`, ☆→`~`, ⊙→`()`, ⚑→`>>`, ◆→`<>`, ◈→`#`, ✓✓→`OK`), header.ts E/W/S/F tooltipy (▤▲▼Σ☻¤✓ drop, `→/←/∅`→`>/</avg`, brand ⊙→`O`), modules_panel statusIcon ASCII (●○▯▼✕→`o_^vX`), task_queue (`✓`→`OK`, `✕`→`X FAILED`), info_panel/event_log/task_queue/modules_panel close `✕`→`X`, welcome OBS-∷→OBS-··, GameScene help modal ▤⊙▨ drop, world.ts SIGN text `→`→`>`. Zachováno: `↑↓ × » · −` (latin subset / Latin-1). 53/53 testů zelených, TS strict.)

Verze: **v3.4** (2026-04-16, konec sezení 26 — **FVP KISS resources** (ploché S/F/C bez subtypů, metal/components/water/coolant → P2+). **Rolling-window KPI** (FlowHistory ring per game day, `FLOW_WINDOW_GAME_DAYS = 10`, S/F tooltipy s Kapacita/Příjmy/Výdaje/Bilance/Runway slovně). **Coin žlutá placeholder** bez tooltipu. **32 cryo crew** (SEED_CREW_CRYO, MedCore 32 cryolůžek). **ModulesPanel [M]** (nový, levý mutex s [I], per-module stats + task progress). **InfoPanel redukce** (jen Posádka + Základna). **VT323 font** (CS-complete) + **+2 px scale bump** + `FONT_SIZE_TOOLTIP`. **Observer Edition release prep** (v0.7, welcome text přepracován na Pozorovateli / 32 cryo / cílová orbita / Teegarden's Star, help plně CZ, PLAYTEST_GUIDE.md v rootu). **Build ID** injection přes Vite define (`__BUILD_ID__` v identity tooltipu). 53/53 testů zelených.)

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

**S28 hotovo (audit + cleanups + retire + dokovací MVP):**
- **@AUDIT:CODE** (`audit/audit_260416_code.md`) — první od 04-13. 4 z 5 starých dluhů vyřešeno; identifikováno 6 nových (F1-F6).
- **F1 — `world.ts` extrakce** (1166 LOC → 14 souborů v `world/`). API zachováno přes re-exporty v `index.ts`. Max soubor 195 LOC, SLAP obnoven.
- **F4 — `InteractiveGameObject` type** v tooltip.ts (cast `as unknown as` retired).
- **F6 — `UI_MASK_WHITE`** konstanta v palette.ts (3× hardcoded `0xffffff` v mask graphics nahrazen).
- **F5 — globální ESC handler** — priority chain v GameScene: modal → welcome → modules → info → task → event. Lokální ESC listenery v modal/welcome odstraněny.
- **F2 — lightweight DRY** (`ui/panel_helpers.ts`) — sdílené konstanty + LS pref helpery pro 4 panely. Full base class odložen na 5. panel.
- **F3 — logic-only smoke testy** — `panel_helpers` + `world/{format,flow,bay}` testy. 53 → 88 testů.
- **Asteroid system retire** — `orbit.ts` (159 LOC) smazán. PNG ponechán, IDEAS sekce s plánem návratu (P2+ s damage mechanikou).
- **Drift magnitude** 7 → 30 px (4× silnější). **Damage** 3 fixed → 1 critical (`START_DAMAGE_HP_RATIO`).
- **Layered bay axiom retire** — `Bay` union zúžen na `void | module_root | module_ref`. Smazáno: `CoverVariant`, `BayDef`, `BAY_DEFS`, `SKELETON_HP_MAX`, `COVERED_HP_MAX`. Dead `ui/side_right.ts` smazán. IDEAS sekce „Layered bay axiom (retired S28)".
- **Loď kompaktní** — `createInitialWorld` přepsán: 8 modulů (Hab + 2× Sol + Med + Ass + CP + 2× Sto) přilepených k motoru v `BODY_IDXS = [2,3,4,5,10,11,12,13]`. 4 void bays vlevo (cols 0-1).
- **⊙ Brand ikona** vrácena přes `BrandIcon` (Phaser Graphics, kruh + tečka). Nezávislá na fontu, ruší S27 ASCII fallback `O`.
- **Bottom Bar** — mezery mezi `[X]` a popisem odebrány: `[I]info [M]modules [E]events [T]tasks [H]help`.
- **Font 3-level konsolidace** — 11 konstant → 3:
  - **`FONT_SIZE_CHROME` 24 px** — Top Bar, Bottom Bar
  - **`FONT_SIZE_PANEL` 22 px** — všechny 4 panely (header + content), modal, welcome, commandButton
  - **`FONT_SIZE_TIP` 20 px** — tooltipy + footer/btn/hint texty
- **`T:` prefix split** — `formatGameTime` (Top Bar, kontextuální tag) vs `formatGameTimeShort` (Event Log, Task Queue — čistý čas).
- **ModulesPanel UX** — repair progress branch retire (patří do [T]). Přidán „Stav modulů" 5color rating header (`statusRating(w.status.base.pct)`).
- **Dokovací systém MVP** — `DockManager` singleton (77 LOC) + `setSegmentX` setter. BELT re-centruje do volné zóny mezi otevřenými panely. Mutex pairs zachovány. ~108 LOC celkem.

**S27 hotovo (font glyph fallback fix — „Další bagr" #12 ✅):**
- Diagnóza: Google Fonts CSS `latin` subset pro VT323 doručuje `unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, ..., U+2191, U+2193, U+2212` — geometric/dingbats/exotické arrows mimo → browser fallback na monospace rozbíjel baseline.
- KISS ASCII substituce napříč rendered code (žádný switch fontu, žádný self-host):
  - `events.ts` VERB_CATALOG (24 entries): ◉→`*`, †→`x`, ✓→`+`, ▲→`+`, ▽→`v`, ↘→`\`, →→`>`, ✓✓→`OK`, ☆→`~`, ⊙→`()`, ⚑→`>>`, ◆→`<>`, ◈→`#`
  - `header.ts` E/W/S/F tooltipy: ▤▲▼Σ ☻¤ ✓ DROPnuté (label nese význam), `→/←/∅`→`>/</avg`, brand `⊙`→`O`
  - `modules_panel.ts` statusIcon: ●○▯▼✕→`o _ ^ v X`
  - `task_queue.ts`: ✓→`OK`, ✕→`X FAILED`
  - close buttony napříč: `✕`→`X`
  - `welcome.ts` OBSERVER_ID `OBS-∷-042`→`OBS-··-042`
  - `GameScene.ts` help modal „Co sleduješ" sekce: ikony nahrazeny textovými labely
  - `world.ts` SIGN event text `→`→`>`
- Zachováno: `↑↓ × » · −` (latin subset / Latin-1)
- 53/53 testů zelených, TS strict čistý

**S26 hotovo (release-ready FVP Observer Edition v0.7):**
- **FVP KISS resources** — ploché Solids/Fluids/Coins (subtypy metal/components/water/coolant → P2+ `Resource subtypes` TODO)
- **Rolling-window KPI** — `FlowHistory` ring per game day, `FLOW_WINDOW_GAME_DAYS = 10`, S/F tooltipy mají Kapacita/Příjmy/Výdaje/Bilance/Runway (slovní: naplní/vyprázdní za X game-day / stabilní / vyčerpáno / naplněno)
- **Coin** = žlutá placeholder, tooltip odstraněn (FVP = nespotřebovává/nedoplňuje se)
- **32 cryo crew** — `SEED_CREW_CRYO = 32`, vazba na MedCore 32 cryolůžek, player + colonist_01..31
- **ModulesPanel [M]** — nový panel vlevo, mutex s [I]; per-module status/HP/power/capacity + active task progress bar; hotkey M, LS persist
- **InfoPanel redukce** — jen Posádka + Základna (Zásoby/Energie/HP avg → Top Bar infotipy)
- **VT323 font** (Google Fonts OFL, CS-complete) + **+2 px scale bump** napříč, `FONT_SIZE_TOOLTIP` samostatná konstanta
- **Observer Edition** — welcome text přepracován (Pozorovateli / 32 cryo / Teegarden's Star / cílová orbita / teaser probuzení bez CTA), help plně CZ, PLAYTEST_GUIDE.md v rootu, v0.7 bump
- **Build ID** — Vite define `__BUILD_ID__ = Date.now().toString(36)` v Top Bar identity tooltipu (sanity check pro user, že načetl aktuální verzi)

**S25 hotovo (velký refaktor):** Drone E drain (productionTick: `netPower - droneDraw - softwareDraw`). QuarterMaster hystereze 40–60% (RESUME 3 → 4). Dashboard 5-color kánon (`ratingColor(pct)` helper, `metricColor` retirement). `isProductiveTask(t)` sdílený predikát. workTooltip dedup. **Software třída** + příkon (QM v2.3 = 0.86 W; E=0 → SW offline + DRN:CRIT). **Repair recipes** (M:N reference Modul/Bay → Solids/Fluids subtypy; per-HP rate; gate na deficitu kterékoli složky s důvodem `no <subtype>`). **E infotip** moduly agregované per kind. **Kvintet rename**: Pevné/Solids (S), Tekutiny/Fluids (F) — `Slab`/`Flux` retirováno z displaye i kódu. **Resource Taxonomy** (rarity Common→Epic + logistics matrix Solids/Fluids — P2+ design baseline). **Food + Air retire (KISS)**: `solids.food` (atribut, ne kategorie) + `fluids.air` (24th-cent recyklace) odstraněny. FVP subtypy: Solids = {metal, components}, Fluids = {water, coolant}. Top Bar S/F bary = worst-of subtypů. **Memory** `feedback_lang_convention.md` (code EN, display CZ). **AUDIT:CODE + AUDIT:DOCS** pass.

**S24 hotovo:** Integrita (II.2, `entropy` → `integrity`, E vyjmuta). Protocol (GLOSSARY — AI CPU + knowledge base). Responsive Layout (KISS — fix panely, canvas = viewport, 2D pozadí). CLAUDE.md Design principy sekce. **QuarterMaster v2.3** (autopilot: E gate + kapacitní check, min-HP target, eternal monitor, cleanupOldTasks 1 h). Task lifecycle (pending/active/paused/completed/failed/eternal). Task Queue Panel [T] (5-color semafor, radio s [E]). TASK event verb (◈). Progress bar `███░░░░░░░`. W rating = availability (Censure fix — semafor sdílí metriku s ukazatelem). Bay tooltip stav tasku místo klik.

**S23 hotovo:** Tooltip barevný header. SIGN eventy barevné. Phase retirement. Kvintet infotipy. ENERGY_MAX dynamický. Work model eureka. Hauler retirement.

**S22 hotovo:** Mobile touch. Event format CZ. InfoPanel UX. Energy infotip.

**Další bagr (Release 2 — Player Awakening Edition):**
1. **Wake-up mechanismus** — probuzení prvního kolonisty (welcome CTA „Probudit"), cryo → idle → working lifecycle. Bez něj observer sim stagnuje.
2. **Player HP ekonomika** — working aktér drainuje HP per tick; recovery via rest/idle; game over při HP=0.
3. **Commands palette** — `[B]uild [R]epair [D]emolish` v Bottom Baru + hotkeys; klik na bay v Player mode → akce (repair infra už existuje).
4. **Scripted capsule drops** — každých 2-3 game days ARRV event s +S/+F/+Coin, narativní text (opačný pól bilance S/F).
5. **Energy=0 → cryo failure trigger** — E=0 → WAKE random 3 → homeless HP drain → DEAD cascade (SW offline už máme).
6. **Observer/Player mode switch** — indikátor v Top Baru, hotkey toggle nebo irreversible welcome.
7. **Research ladder** — QM upgrade v2.3 → v2.4 unlock capability; unlock module kinds.
8. ~~**Inteligentní postranní dokování panelů**~~ ✅ S28 — DockManager MVP. BELT axiom „panel ustupuje, ne BELT" implementován. P2+ rozšíření: auto-side decision, vertikální stack, tween animace.
9. **II.2 Integrita jako rate** — přepis snapshot → Δ HP / game day (repair vs. decay).
10. **Lazy filter chips** — chip UI pro verb filtrování v EventLog.
11. **Module FX animations** — blink/fan/dish/sparks. Data-driven (`ModuleDef.fx?`) nebo shader pipeline.
12. ~~**Font glyph fallback fix**~~ ✅ S27 — KISS ASCII substituce napříč rendered code (events.ts VERB_CATALOG, header.ts tooltipy, modules statusIcon, close buttons, OBSERVER_ID, help modal, SIGN texty). Latin-1/latin subset bezpečné chars zachovány. P2+ alternativa (pokud bude vůle): self-host VT323 TTF s `unicode-range: U+0000-FFFF` v `@font-face` — vrátí všechny původní glyphy.

**Terminologie prototypů:** P1/P2/P3/P4 = **POC** (proof of concept), ne MVP. Cíl = dialog s blízkými, ne trh.

**Terminologie entit:** WORLD → BELT → SEGMENT → MODULE → BAY. Pojem „Cell" retirován. SHIP-Bow/Stern retirován (S6).
