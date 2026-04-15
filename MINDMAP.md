# MINDMAP.md — ⊙ Voidspan

Myšlenková mapa projektu. Slouží k nalezení fokusu: **kde máme maso, kde díru, co je záclona a co základ**.

Aktualizuj kdykoli se změní struktura projektu (nový bod, přejmenování, přesun). Stav naplnění značí, kolik je v dané větvi skutečně rozhodnuto.

**Legenda stavu:** `[●]` plné / `[◐]` rozpracováno / `[○]` prázdno / `[✕]` zrušeno.

Verze: **v2.6** (2026-04-15, konec sezení 22 — **Mobile touch** (bottom bar buttony, touch drag scroll, orientationchange, viewport meta). **Event format axiom S22** (formatEventRow preferuje text pole = lidská věta; české texty; SIGN driver resource „Air ↓ Dostačující → Slabá"; severity warn→orange izomorfní s ratingem). **InfoPanel UX** (pyramida I→II řazení, Unicode ikony dvousloupcový `☻⌂≡↯▲◆` 18px, scroll system s GeometryMask+scrollbar+wheel+drag). **Energy infotip** (Top Bar E: stav+rating, příjmy/výdaje/bilance, TOOLTIP_LIST_MAX_ITEMS=5). **Tooltip responzivní šířka** (bez fixního MAX_WIDTH). **IV. Společnost** (přejmenováno). **Environment detection** (hostname→local/GH Pages). **52/52 testů zelených.**)

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

**S22 hotovo:** Mobile touch (bottom bar buttony, drag scroll, orientationchange). Event format axiom (lidské věty CZ, SIGN driver resource, severity izomorfismus s ratingem). InfoPanel pyramida + Unicode ikony dvousloupcový layout + scroll. Energy infotip (Top Bar E: příjmy/výdaje/bilance). Tooltip responzivní šířka. IV. Společnost. Environment detection.

**S21 hotovo:** Event Log System kompletní. Phase win/loss retirováno. Actor cryo/hp/dead. Energy/decay model. Status tree pyramida vitality. InfoPanel [I]. Sdílená feedback memory.

**Další bagr:**
1. **Energy=0 → freeze + cryo failure** — všechny entity bez E se zastaví, HP astronautů klesá. Řetěz zánik.
2. **Tooltip barevný header** — SIGN/Energy stav s 5stavovým semaforem (headerText objekt v TooltipManager).
3. **Per-capita resource drain** — `resourceDrain` bez phase gate, `n_alive × per_actor_rate`.
4. **autoEnqueueTasks** — drony samy opravují critical HP. Observer-driven priority queue.
5. **Energy cost per WD** — repair/build tasky stojí i energii, drony se nabíjí wifi.
6. **Build/demolish progrese** (zůstává z S18 split). Player mode only.
7. **Floating panel manager** — K/U/Z/E/P workspace. Globální ESC z S19 TODO.
8. **Lazy filter chips** — chip UI pro verb filtrování v EventLog.
9. **Module FX animations** — blink/fan/dish/sparks. Data-driven.

**Terminologie prototypů:** P1/P2/P3/P4 = **POC** (proof of concept), ne MVP. Cíl = dialog s blízkými, ne trh.

**Terminologie entit:** WORLD → BELT → SEGMENT → MODULE → BAY. Pojem „Cell" retirován. SHIP-Bow/Stern retirován (S6).
