# MINDMAP.md — ⊙ Voidspan

Myšlenková mapa projektu. Slouží k nalezení fokusu: **kde máme maso, kde díru, co je záclona a co základ**.

Aktualizuj kdykoli se změní struktura projektu (nový bod, přejmenování, přesun). Stav naplnění značí, kolik je v dané větvi skutečně rozhodnuto.

**Legenda stavu:** `[●]` plné / `[◐]` rozpracováno / `[○]` prázdno / `[✕]` zrušeno.

Verze: **v1.9** (2026-04-13, konec sezení 15 — Audit 260413 DOCS+CODE, Resource Model v0.1 refactor v kódu (`world.ts` → `{slab:{food}, flux:{air}, coin}`, `cost_coin`), hotkeys case-insensitive, Echo/Kredo sweep napříč docs, SCENARIO legacy Act -1 až V retirováno (§3/§4 → Appendix A/B), SPECIFICATION v0.2 snapshot, GameScene split 759→201 LOC do `ui/*` (5 panelů: header/segment/actors/side_right + layout + panel_header), Top Bar vycentrován, Help přesunut do Bottom Baru inline `[H]`, Observer vs. Player mode axiom. 45/45 testů zelených.)

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
│   │    (WORLD/BELT/SEGMENT/MODULE/TILE, 256×16,
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
│   └── 4.5 Scripted events (katalog)                 [○]
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
│   └── 6.5 Moderation & LLM                           [○]
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

**Audit + refactor hotové (S13–S15).** Kód sjednocen s GLOSSARY axiomy: Resource Model v0.1 v `world.ts`, hotkeys case-insensitive, GameScene split do `ui/*` panelů. Dokumentace pročištěna: SCENARIO legacy retirováno, SPECIFICATION v0.2 snapshot, Echo/Kredo sweep. Observer vs. Player mode axiom zapsán — P1 je čistě Observer (kolonijní HUD, per-actor HP přijde v P2+). **45/45 testů zelených, 0 kritických findings.**

**Další bagr:**
1. **Napojit HUD na reálná čísla modelu** — Top Bar resource bars mají dosud demo seedy; napojit na `world.resources.{flux.air, slab.food, coin}`. Energy/Work zatím 0 (P2+).
2. **Floating panels — Kolonisté (K) / Úkoly (U) / Zdroje (Z)** implementace. FloatingPanelManager helper + toggle logika.
3. **TODO triage (DOCS F6)** — rozdělit R1/R2/R3, re-klasifikovat Q-otázky P1 vs. P2+.
4. **GitHub push + GH Pages deploy + CI** — sdílitelná URL pro P1–P4 playtestery.
5. **Assety P1 trojice** (SolarArray, Engine, Dock) — delší sezení per asset.
6. **Event Log ticker** (Bottom Bar content) — task completion / FSM přechody → log feed.
7. **Build task UX §15 rozšíření** — klik empty → menu `[Postav SolarArray]` → enqueue build.
8. **Playtest kalibrace CAL-*** — seed hodnoty po prvním hratelném buildu.

**Terminologie prototypů:** P1/P2/P3/P4 = **POC** (proof of concept), ne MVP. Cíl = dialog s blízkými, ne trh.

**Terminologie entit:** WORLD → BELT → SEGMENT → MODULE → TILE. Pojem „Cell" retirován. SHIP-Bow/Stern retirován (S6).
