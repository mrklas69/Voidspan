# MINDMAP.md — ⊙ Voidspan

Myšlenková mapa projektu. Slouží k nalezení fokusu: **kde máme maso, kde díru, co je záclona a co základ**.

Aktualizuj kdykoli se změní struktura projektu (nový bod, přejmenování, přesun). Stav naplnění značí, kolik je v dané větvi skutečně rozhodnuto.

**Legenda stavu:** `[●]` plné / `[◐]` rozpracováno / `[○]` prázdno / `[✕]` zrušeno.

Verze: **v2.4** (2026-04-15, konec sezení 20 — **@AUDIT:CODE + @AUDIT:DOCS cleanup** (paleta overlay/trajectory konstanty, `tuning.ts` centrální laditelné parametry, SPEC §4.1 Cell→BAY/SEGMENT, SCENARIO Echo/Kredo→Energy/Coin 9×, MINDMAP sync §4.5/§6.5), **Simulation axioms (GLOSSARY kánon):** Colony Goal (single), Perpetual Observer Simulation, Two Perspectives (Observer vs Player), Maslow (N na pevném N-1), FVP (First Viable Product). **Status — Strom zdraví kolonie** (I. Aktuální stav × II. Udržitelnost × III. Rozvoj × IV. Společenský kapitál; parent=worst child; FVP = I.1+I.2+II.1+II.2). **Event Log System** (verb+csq taxonomie, 23 verbů, 4 severity → paleta, ring buffer 500, lazy filter chips, Unicode ikony; hotkey `[E]`). `stepWorld` refactor → 11-slot pipeline (decayTick/resourceDrain/autoEnqueue/assign/progress/actorLife/production/arrivals/events/status/log). `Actor.state` += `"dead"`. Bottom Bar Commands font `FONT_SIZE_CMD` 12px (¼ menší než HINT). **52/52 testů zelených.**)

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
│   └── 3.3 Oblasti hry                                [◐]
│        ├── 3.3.1 Materiál & provoz (ekonomika+infra)
│        ├── 3.3.2 Výměna (obchod + diplomacie)
│        ├── 3.3.3 Řád (politika + právo/justice)
│        ├── 3.3.4 Společnost (skupiny 3-tier + migrace)
│        ├── 3.3.5 Konflikt (válka, sabotáž, rebelie)
│        └── 3.3.6 Vědění (věda + média + kultura/paměť)
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

**S20 hotovo:** @AUDIT:CODE + @AUDIT:DOCS cleanup (paleta sémantika, `tuning.ts`, Cell→BAY, Echo/Kredo→Energy/Coin). **Simulation axiom framework do GLOSSARY:** Colony Goal single, Perpetual Observer Simulation (žádný WIN/LOSS v Observer perspektivě, Player GAME_OVER je P2+), Two Perspectives, Maslow (N na pevném N-1), FVP = First Viable Product. **Status tree** (I/II/III/IV × kvantita/kvalita, parent=worst child). **Event Log System** design kánon (verb+csq taxonomie, 23 verbů, 4 severity, Unicode ikony, ring buffer 500, lazy filter chips). `stepWorld` 11-slot pipeline scaffold (axiom fixed, těla postupně). `Actor.state += "dead"`.

**Další bagr:**
1. **EventLog implementace** — AKUTNÍ (FVP dependency). Datový model do `world.ts`, `events.ts` s verb katalogem + severity lookup, `EventLogPanel` layer 3.5, hotkey `[E]`, lazy filter chips, auto-scroll. Spec hotová v GLOSSARY.
2. **Perpetual Observer — phase retirement** — zrušit `Phase.win/loss`, `toLoss`, `loss_reason`. Přepsat testy. Top Bar cleanup (pryč `PHASE A — HULL BREACH` / `LOSS` text).
3. **Actor HP + dead wiring** — `Actor.hp`, `hp_max`, `actorLifeTick` drain per nedostatek. HP=0 → `state="dead"`, simulace běží dál.
4. **Decay model** — `decayTick` per game-day, `DECAY_PER_GAME_DAY` v `tuning.ts`. Status II.2 ožije.
5. **Per-capita resource drain** — `resourceDrain` bez phase gate, `n_alive × per_actor_rate`.
6. **Status tree agregace** — `recomputeStatus` → `w.status`, Observer UI dashboard.
7. **Build/demolish progrese** (zůstává z S18 split) — task kindy build_skeleton/build_cover/build_module + demolish. Player mode only.
8. **Production tick** — SolarArray → E, Greenhouse → food (až bude modul), MedCore heal.
9. **Floating panel manager** — K/U/Z/**E**/P workspace (E už ze S20). Globální ESC z S19 TODO.
10. **Module FX animations** — blink/fan/dish/sparks. Data-driven přes `MODULE_DEFS.fx[]`.
11. **Asteroid damage** + **Surface overlay system** — IDEAS parkoviště.

**Terminologie prototypů:** P1/P2/P3/P4 = **POC** (proof of concept), ne MVP. Cíl = dialog s blízkými, ne trh.

**Terminologie entit:** WORLD → BELT → SEGMENT → MODULE → BAY. Pojem „Cell" retirován. SHIP-Bow/Stern retirován (S6).
