# DONE.md — Voidspan

Hotové úkoly. Přesouvá se z `TODO.md`.

## 2026-04-12 (Sezení 6 — POC_P1, SHIP revize)

- [x] **Q17 rozsah P1 POC** uzavřeno: **single-player puzzle** s WIN/LOSS, jedním pokusem, refresh = nová hra.
- [x] **Scénář P1** = (A) Únik vzduchu (krize, time-pressure) + (B) Engine→Dock (normal task) + (C) volitelný bonus.
- [x] **SHIP revize** na 1 segment (S5 2-segment config byl over-provisioned — modulová math se vešla do 16 tiles s 1×1 moduly).
- [x] **Bez brains v P1** — přímé příkazy (brains = P2+).
- [x] **`CONST_PUZZLE_SLACK_FACTOR = 2`** — univerzální heuristika (timeout/budget = 2× optimum).
- [x] **POC_P1.md v0.1** založen — 11 sekcí, goal+format+scope+scénář+in/out+WIN/LOSS+kalibrace+asset list+success criteria.
- [x] **GLOSSARY v0.4** — SHIP section přepsána, SHIP-Bow/Stern retired, konstanta přidána.
- [x] **SCENARIO v0.4** — §4.0 SHIP Wake-up aktualizován na 1 segment.
- [x] **TODO** — Q17 uzavřeno, CAL-* kalibrační sekce přidána, Art sezení P1 naplánováno.
- [x] **MINDMAP v1.2** — fokus posunut na Art sezení + kalibraci + 3.2 Postava.

## 2026-04-12 (Sezení 5 — Prostor a čas, datový model, Energy Model)

- [x] **Hierarchie entit** WORLD → BELT → SEGMENT → MODULE → TILE ustavena; „Cell" retirováno.
- [x] **CONST_BELT_LENGTH = 256**, **CONST_SEGMENT_VOLUME = 16** (grid 2×8).
- [x] **SHIP startovní konfigurace** = 2 segmenty (Bow + Stern), 32 tiles, 8 zakládajících kolonistů v kryo.
- [x] **Energy Model** (W / WD) ustaven — jednotná mechanika pro hmotnou práci.
- [x] **Capability Matrix** (Build/Haul/Guard/Heal/Fight) + specializace (1 role na slot).
- [x] **Drone Fleet** = 8 Constructors + 4 Haulers + 4 Marshals (multi-funkční, analogie Module Specialization).
- [x] **Module Specialization Principle** (integrované slabé → dedikované mocné).
- [x] **HOMELESS status** + HP drain 1 HP / herní hodina.
- [x] **Lawlessness formula** (KISS linear, `belt.lawlessness = max(0, 1 - marshals/CONST_MARSHAL_BASELINE)`).
- [x] **Time model** — základní jednotka 1 s, herní den 16 h, TIME_COMPRESSION ~16×.
- [x] **Schedule activities P1** = Work | Eat | Sleep | Relax | Move.
- [x] **Q12 jméno hvězdy = Teegarden's Star** (SO J025300.5+165258), soustava = Teegarden System.
- [x] **Q-World-1 vertikální síť beltů** kolem Teegardenu, adresa `Teegarden.BeltN`.
- [x] **Observatory Event** (scripted) jako narativní trigger R1 Belt Network.
- [x] **Founding Colonist Invitation** (nový typ pozvánky, garantované oživení pro prvních 8).
- [x] **SHIP Wake-up scénář** v SCENARIO §4.0.
- [x] **GLOSSARY.md v0.3** — kompletně přepsán k hierarchii a Energy Modelu.
- [x] **MINDMAP 3.1 [◐] → [●]**, 4.3 Network Arc [○] → [◐].

## 2026-04-12 (Sezení 4 — Mapa, refactor, SPECIFICATION)

- [x] **Založen MINDMAP.md** — kořenová mapa projektu, stavy uzlů, čte se na `@BEGIN`, aktualizuje na `@END`.
- [x] **Bod 1 mapy (PROČ) uzavřen** — cílový hráč dvoufázově, zážitek sociální drama, autorská motivace 3 vrstvy, žánr 40/40/20.
- [x] **Bod 2 mapy (CO) uzavřen** — Dune II look, tenety jako kandidáti, prolog únik ze Země, Cell Binding Protocol, Faction Hierarchy 4×3.
- [x] **Bod 3 refactor** — 9 → 3 hlavních uzlů; Prostor → Postava → Oblasti; 6 konsolidovaných větví.
- [x] **Bod 4 refactor** — SVĚT → OBLOUKY/ARCS, 4 game-loopy A/B/C/D.
- [x] **Player Arc (C) draft** v SCENARIO.md.
- [x] **Session Arc (D) draft** v SCENARIO.md — rytmus 1×/den.
- [x] **Brains revize** — z „Phase 2+" na core POC feature.
- [x] **Q-Player-Schema:** POC = STATUS + RANK + SKILL, PERK Phase 2+.
- [x] **Q9 Tempo:** time-gated akce, brains drží prioritu, žádná denní energie.
- [x] **Revize R1/R2/R3** zapsány v IDEAS.md.
- [x] **SPECIFICATION.md v0.1 DRAFT** založena — zadávací dokumentace s červeně označenými mezerami.
- [x] **@AUDIT:DOCS první** — `audit/audit_260412.md`, 11 findings, ★4.0/5.
- [x] **Audit low-effort fixy (F2/F3/F5/F7/F11):** Q9 duplikát, Act→Arc reference v GLOSSARY, Q-status flagy, T3 kandidát, prototyp→POC sweep.

## 2026-04-12 (Sezení 2 — Hosting & Stack)

- [x] **Q6:** Zjistit typ hostingu na Betelgeuse.com. **Zjištěno:** Forpsi Easy Windows (sdílený IIS 10, PHP + .NET Core, MSSQL 2019 + MySQL 8, App Pool 256 MB / 25 % CPU, Timer pro plánované úlohy). Pro real-time perzistent world **nestačí**.
- [x] **Rozhodnutí A2 — Real-time VPS.** Volba: **Forpsi VPS Linux Basic** (160 Kč/měsíc, 2 vCPU, 4 GB RAM, 40 GB NVMe, root).
- [x] **Q12:** Backend runtime → **Node.js 22 + TypeScript**.
- [x] **Q13:** Databáze → **SQLite pro prototyp**, Postgres později.
- [x] **Q14:** Frontend engine → **Phaser 3** (Voidspan = živý animovaný svět, ne statická mapa).
- [x] **Q15:** Síťový protokol → **Colyseus** (authoritative server, auto state sync).
