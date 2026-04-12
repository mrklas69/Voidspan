# TODO.md — Voidspan

Konkrétní úkoly. Hotové položky přesouvej do `DONE.md`.

## Revize S4 — k zapracování do dokumentů

- [ ] **R1 Multi-colony:** přepsat `GLOSSARY.md` (Belt → síť beltů), `SCENARIO.md` §4.4 (frakce mezikolonijní), aktualizovat World Browser v IDEAS (active competition view).
- [ ] **R2 Penal colony + amnesty:** nová sekce v `SCENARIO.md`, napojit na Endings spectrum a Act III krize.
- [ ] **R3 Alts policy:** dopsat do `SCENARIO.md` sekce 11 (onboarding) jako feature, ne restrikci.
- [ ] **Terminologie:** nahradit „prototyp/pilot" → **POC** (proof of concept) v TODO a dalších dokumentech konzistentně.
- [x] **Q-World-1 (S5):** fyzický vztah mezi belty po R1 = **vertikální stacking kolem jedné hvězdy** (Teegarden). Adresa `Teegarden.BeltN`. Detail IDEAS „Belt Network".
- [ ] **Q-Player-Origin:** proč hráč uniká ze Země — provinění/trest vs. elita/mise vs. jiné. Mlhavost zachovat jako feature, ale rozpracovat varianty.
- [ ] **Q-Comm-Privacy:** rozsah neprotokolované komunikace mezi hráči (kanál, limity zprávy, anti-abuse, moderace). Viz Faction Hierarchy v IDEAS.
- [x] **Q-Player-Schema (S4):** POC = STATUS + RANK + SKILL. PERK Phase 2+. STATUS = aktuální role (kontextuální), RANK = pozice v hierarchii (občanství + role), SKILL = praxí rostoucí dovednost.
- [x] **Q9 Tempo (S4):** time-gated akce, duration minuty–hodiny, brains drží prioritu mezi loginy. Žádná denní energie v POC. Default rytmus hráče: ~1× denně, 10–20 min session.
- [ ] **Q-Brains-Schema:** UX brains — kolik sliderů, jaká granularita, jaké kategorie, jak vizualizovat v UI. 3–5 os pro POC.
- [ ] **Q-Institutional-Mail:** formát komunikace hráč↔instituce (správní rada, banka, parlament, šerif). Šablony? Free text? Response timeline? Viditelnost?
- [ ] **Q-Session-Rhythm:** pobídky k návratu — push/email notifikace? Nebo jen přirozená zvědavost? Anti-exploit pokud hráč loguje 10×/den.
- [ ] **Q-Delegate-Scope (Phase 2+):** nad brains režimy API/AI. Odloženo, viz IDEAS.

## Otevřené otázky designu (po pivotu na prstenec, alien star)

- [~] **Q7:** Identita hráče — **částečně zodpovězeno v S4** (STATUS+RANK+SKILL, Cell Binding, alts povoleny). Zbývá: forma (avatar / loď / korporace / hybrid).
- [x] **Q9:** vyřešeno v S4 jako „Q9 Tempo" výše. Duplikát odstraněn.
- [~] **Q10:** Úroveň programování brains — částečně: POC = slidery (3–5 os). Phase 2+ = API/AI. Viz Q-Brains-Schema.
- [x] **Q11:** Vítězná podmínka — **žádná vítězná podmínka, peak = pamatovatelný příběh**. Viz SPECIFICATION §2.2 a Endings Spectrum (Colony Arc 2.7). Zavřeno v S1–S4.
- [x] **Q12 (S5):** Jméno hvězdy = **Teegarden's Star** (SO J025300.5+165258). Soustava = Teegarden System.
- [x] **Q13 (S5):** `CONST_BELT_LENGTH = 256`.
- [ ] **Q14:** Cena a mechanismus *Orbital Shift* (kolik Kredo, jaké hlasování, jak dlouho trvá). Rozšíření: v R1 Belt Network = pohyb mezi vertikálními vrstvami.
- [ ] **Q15:** Století Earth reference (může zůstat otevřené, viz T1 prequel tenet).
- [x] **Q17 (S6):** Rozsah P1 POC — **single-player puzzle**, SHIP = 1 segment, krize Únik vzduchu + Engine→Dock, WIN/LOSS s 1 pokusem. Plný zápis: `POC_P1.md`.
- [x] **Q-P1-Arch (S7):** Architektura P1 = **pure client, static hosting** (Phaser+TS+Vite, GitHub Pages / Netlify). Žádný server, žádná DB, žádný log. Plný zápis: `POC_P1.md` §12.
- [x] **Q-P1-Telemetry (S7):** Žádný event log v P1. Feedback mimo hru (rozhovor s P1–P4). Důvody v `POC_P1.md` §12.
- [x] **Q-P1-Input (S7):** Task-oriented input (hráč zadává cíle, engine přiřazuje drony). Micro override povolen. Viz `POC_P1.md` §15.
- [x] **Q-P1-Character (S7):** Hráč = aktér-drone s W=8, v P1 vždy `working`, prohrává s kolonií. Narativně probuzený Founding Colonist #1. Viz `POC_P1.md` §3+§13.
- [x] **Q-P1-Tick (S7):** Logický tick = 250 ms (4×/s), render na rAF. `TIME_COMPRESSION 240×` → 1 game hour = 60 ticků. Viz `POC_P1.md` §14.
- [x] **Q-P1-UI (S7):** Wireframe: 1280×720 baseline, horizontální 8×2 segment, pravý sloupec Task Queue + Inspector, levý Actors, horní HUD, dolní Log. Ikony Tabler (free MIT). Viz `POC_P1.md` §16.
- [x] **Q-P1-Onboarding (S7):** Diegetický onboarding, prvních 30 s. Klik „Probuzení" → HULL BREACH → 2 contextové bubliny → task. Tón: suché military/tech reporty. Viz `POC_P1.md` §17.
- [x] **Q-P1-Dialogs (S7):** Závěrečné dialogy — 2 WIN varianty (A základní, B s bonusem) + 3 LOSS varianty (air-A, air-B, food-B). Struktura header/narativ/signature/footer. Viz `POC_P1.md` §18.

## Otevřené otázky z S5 (Prostor, čas, energie)

- [ ] **Q-Energy-Calibration:** konkrétní WD náklady akcí (stavba Greenhouse, SolarArray, Habitat), W dronů ostatních rolí. Ladit v P1 playtestu.
- [ ] **Q-Homeless-Modifiers:** o kolik oddálí HP drain kvalitní strava / relax / léčení. Baseline = 1 HP / herní hodina.
- [ ] **Q-Decay-Rate:** trvání DEVELOPED → DECAYING → LOST bez údržby. Návrh 3–7 dní hry.
- [ ] **Q-Day-Length:** potvrzení 16 h herního dne vs. 8 h (ladit s rytmem session).
- [ ] **Q-Time-Compression:** finální poměr wall/herní čas (provisional 16×, tj. 1 h wall ≈ 1 herní den).
- [ ] **Q-Capsule-Timeout:** timeout pro auto-recyklaci (hodiny / 1–2 dny). Závisí na aktivitě kolonie.
- [ ] **Q-Greenhouse-Size:** rozměr Greenhouse modulu (kolik tiles = kolik jídla / den pro kolik lidí).
- [ ] **Q-Observatory-Trigger:** konkrétní práh výzkumu pro spuštění Observatory Event.

## Kalibrační otázky P1 (CAL-*)

Seed hodnoty zapsány v `POC_P1.md` §10 (S7). Finální čísla se doladí playtestem.

- [~] **CAL-A1** Únik vzduchu: seed 10 WD, optimum ~3,3 min wall, timeout ~6,5 min.
- [~] **CAL-B1** Engine demontáž: seed **60 WD** (revize dolů ze 120 z S5).
- [~] **CAL-B2** Dock 2×2: seed 48 WD + 20 Kredo.
- [~] **CAL-B3** Zásoby: seed 40 jídla, 1/osoba/game day, 8 osob → 5 game days = 20 min wall.
- [~] **CAL-T1** `TIME_COMPRESSION` seed **240×** (1 game hour = 15 s wall).
- [~] **CAL-D1** Drony: seed **3 Constructor + 2 Hauler**, Constructor 12 W, Hauler 8 W.
- [~] **CAL-S1** SolarArray 1×1: seed **24 W** (polovina z 2×2 v S5).

## POC projekty k ověření

- [~] **P1 POC — Single-player puzzle** (S6): SHIP Wake-up, krize + Engine→Dock, WIN/LOSS. Zadání: `POC_P1.md`. Implementace čeká na Art sezení + kalibraci.
- [ ] **Art sezení P1** — definovat asset pipeline dle `POC_P1.md` §9 (tile sprites, aktéři, VFX, UI, optional audio).
- [ ] **P2 POC — Entropie & decay:** simulace chátrání cells. Otestovat: je tempo zábavné? jak často hráči přicházejí o claim?
- [ ] **P3 POC — Belt closure UX:** jak vypadá finální spojení posledního cell s hubem. Otestovat: je ceremonie uspokojivá?
- [ ] **P4 POC — Orbital Shift UX:** flow hlasování + dopad na globální parametry. Otestovat: je rozhodnutí srozumitelné? motivuje koordinaci?

## Scénář hry (G3) — rozpracování SCENARIO.md v0.1

- [ ] **Rozložit SCENARIO.md podle čtyř arcs (A/B/C/D):** Player / Colony / Network / Session. Dosavadní Act -1 až post-closure patří do Player Arc (1–2) + Colony Arc (3–8). Network Arc a Session Arc jsou nové sekce.
- [ ] **Scripted events bank — tón první:** napsat 5–10 eventů jako krátké povídky (2–4 věty), bez schématu. Cíl: ověřit narativní hlas Voidspanu.
- [ ] **Scripted events bank — schéma:** zatlouct formální strukturu eventu (trigger, weight, description, hooks, outcomes, act-binding, volatilita). Destilovat z eventů napsaných v „tón první".
- [ ] **Factions & Power Dynamics** — rozepsat sekci 6.
- [ ] **Immigration Mechanics** — rozepsat sekci 7 (vlny, kvóty, politika).
- [ ] **Procedural Layer** — rozhodnout LLM ano/ne, designovat engine-rules (sekce 8).
- [ ] **Emergent Layer** — dokumentovat hráčské vzorce (sekce 9, postupně).
- [ ] **Reset mechanika** — kdo, jak, kdy hlasuje o nové iteraci beltu.
- [ ] **Act -1 & onboarding pipeline** — rozepsat welcome UX, motivační dopis UI, fiktivní IBAN, ghost experience.
- [ ] **Recruitment process** — přesná mechanika rozhodování vlády kolonie (kvóra, timeouts, auto-recycle hlášky).
- [ ] **Citizen tiers** — rozepsat Indenture / Probationary / Full + cesty mezi tiers (čas, quest, patron systém).
- [ ] **Moderation pipeline** — LLM filter pro motivační dopisy, flagging, policy, provoz náklady.
- [ ] **World Browser** — designovat prohlížeč více beltů + historických archivů.
- [ ] **Capsule economy** — kalibrace výnosu recyklace (Echo/Kredo množství).
- [ ] **Výzkumný strom** — kdy / jak se odemyká auto-hunting kapslí.
- [ ] **Forgiveness-rewarded mechaniky** — konkretizovat jak ekonomika/politika/justice realizují Tenet T4.

## Design art (G1)

- [ ] Napsat prompty pro arena.ai (prstencová estetika, V6 setting).
- [ ] Vyběhnout prompty přes více modelů, porovnat.
- [ ] Uložit winner outputs do `art/reference/`.

## HelloWorld pilot (G2) — re-scope po Q-P1-Arch + Q-P1-Telemetry (S7)

Původní plán počítal s Colyseus+WS, pak s Express thin serverem. Po rozhodnutí no-log/no-DB odpadá i backend. Finální re-scope:

- [x] **Lokální skeleton (S8):** pnpm monorepo, `apps/client` (Vite 5 + Phaser 3.87 + TS 5.6 strict), žádný server. Build + dev server běží.
- [ ] Push na GitHub `mrklas69/Voidspan`.
- [ ] Deploy na **GitHub Pages** nebo **Netlify** (static bundle).
- [ ] Ověřit: static build funguje, URL sdílitelná pro P1–P4.

## Infrastruktura (po rozhodnutí Q17)

- [ ] Objednat Forpsi VPS Linux Basic (až bude POC lokálně + na Renderu funkční).
- [ ] Přesměrovat DNS `bete1geuse.com` na VPS IP (A záznam).
- [ ] Zvážit zrušení Easy hostingu po přechodu na VPS.
- [ ] Nastavit systemd service + git pull deploy.
- [ ] Caddy reverse proxy + auto HTTPS.
- [ ] Založit složku `art/` pro 8-bit grafické návrhy.

## Stack — rozhodnuto

**P1 scope (pure client, static hosting — viz POC_P1 §12):**
- Runtime: **TypeScript** (browser)
- Build: **Vite**
- Frontend: **Phaser 3**
- Hosting: **GitHub Pages** nebo **Netlify** (static)
- Repo: **pnpm workspace** s jediným `apps/client` (drží místo pro `apps/server` v P2)
- Žádný server, žádná DB, žádný log, žádná autentizace.

**P2+ scope (až přijde multiplayer/persistence):**
- Multiplayer: **Colyseus** (authoritative, rooms)
- DB produkce: **PostgreSQL 16**
- ORM: **Drizzle** nebo **Prisma** (zatím neurčeno)
- Reverse proxy / SSL: **Caddy** (auto HTTPS)
- Deploy: **VPS Basic 160 Kč/m + systemd**

## Deprecated (přesunuto do IDEAS parkoviště)

- ~~Q8 (mechanismus forku)~~ — zrušeno s forky.
- ~~Větvení, fork limit, Rift jako zdroj~~ — viz IDEAS „Parkoviště".
