# TODO.md — ⊙ Voidspan

Konkrétní úkoly. Hotové položky přesouvej do `DONE.md`.

## Event Log System (S20/S21)

Většina implementována v S21. Zbývající úkoly:

- [x] **Lazy filter chips (S30)** — per-verb (ne verb:csq), wrap 2 řádky, abecední flow layout, LS persist, default all ON (TICK default OFF retirován v iteraci). Chip font 9 px, underline pryč.
- [ ] **IDEAS — click-through navigation** — klik na event s `loc` = camera jump + bay select. P2+ (odloženo, IDEAS banka).

---

## Perpetual Observer Simulation (S20/S21)

Pipeline sloty 1, 6, 7, 10 naplněny v S21. Phase win/loss retirováno. Zbývající:

- [ ] **II.2 Integrita jako rate** — aktuálně snapshot (avg HP bays+moduly). Dle IDEAS/GLOSSARY spec má být **rate** (Δ HP / game day, repair vs. decay trajektorie). Přepsat až bude stabilní decay + repair tick — pak lze měřit trend místo okamžitého stavu. S23 přejmenováno `entropy` → `integrity`, E odstraněno z výpočtu (má vlastní bar).
- [ ] **`resourceDrain` per-capita** (P2+) — stub. Až přijde wake-up + edibles bucket (item registr s `edible` flag), přidat drain edible items per awake actor.
- [ ] **`autoEnqueueTasks` — priority queue** — Observer-driven: critical HP (< 30 %) → auto repair task. Bez hráčského kliku.
- [ ] **`arrivalsTick`** — trigger spawning kapsle. Kde se kolonista probudí, když není Habitat?
- [ ] **`scheduledEvents`** — napojení na events bank (SCENARIO §5). Formální schéma eventu neexistuje.
- [ ] **Cryo failure trigger** — energie=0 → nucené probuzení posádky (WAKE event). Řetěz: decay → energy 0 → cryo fail → wake → drain → dead.
- [x] **Historické WIN/LOSS dialogy** — retirováno (S23, phase retirement). Modaly smazány s phase_a/b/c. `POC_P1.md` smazán S32.

## Responsive Layout ladění (S24, KISS)

Basic responsive layout axiom v KISS verzi (canvas = viewport, všechny UI velikosti fix, přebytek = pozadí, text 18 px). Zbývá doladit:

- [x] **Inteligentní postranní dokování otevřených panelů** — DockManager MVP (S28). BELT se re-centruje do volné zóny mezi otevřenými panely. Mutex pairs zachovány (I↔M, E↔T). P2+ rozšíření: auto-side decision (panel jde tam, kde je míň plno, ~20 LOC), vertikální stack (2 panely na jedné straně, ~40 LOC), Phaser tween animace (~40 LOC), DockManager unit testy (~90 LOC).
- [ ] **Portrait (mobile)** — 360×640 dnes přetéká. Rotace BELTu 2×8 → 8×2 vertikální? P2+.

## UI Layer Stack (S19)

Axiom zapsán v `IDEAS.md` → „UI Layer Stack axiom (S19)". Úkoly:

- [x] **ESC = globální bezpečný odchod** — S28: `GameScene.handleEscape()` priority chain: modal → welcome → modules → info → task → event. Lokální ESC listenery v modal/welcome odstraněny.
- [ ] **#hull-dark mid / light varianty** — rozšířit paletu o 2 alpha varianty `#hull-dark` pro gradient overlay 4.1 → 4.2 → 4.3. Přidat konstanty `UI_OVERLAY_DARK / MID / LIGHT` do `palette.ts`.
- [ ] **Průhledný Top/Bottom panel** — ověřit, zda texty Top/Bottom Baru mají pozadí; pokud ano, odstranit. BELT protáhnout vertikálně pod okraji (když začne scrollovat).
- [ ] **Q-UI-Chrome-Separator** — rozhodnout vizuální oddělení Bottom Bar / Main bez pozadí (jemný okraj, orbit fade, nebo nic).
- [ ] **Q-Modal-Stack** — rozhodnout, zda může být 5.x otevřen nad 5.y (např. Chat 5.4 z Politiky 5.2). Implikuje `ModalManager` se stackem.
- [ ] **Q-WinLoss-Buttons** — P1 Win/Loss obrazovka: Close / Restart / Quit?
- [ ] **Layer 4 overlays (Infotip / Karta / Popover)** — až bude content (`<link>text</link>` syntax v textech). Dnes máme jen tooltip — ekvivalent 4.1. Rozšířit na 4.2 a 4.3.
- [x] **Floating workspace** — realizováno S28+: 4 floating panely (I/M/E/T) + QM Query modal (Q). Hotkey mapa K/U/Z/E/P z původního návrhu nahrazena I/M/E/T/Q. Kolonisté [K] přijde s Player mode (Release 2+).

## Resource Taxonomy (P2+, S25 design prep)

Rarity 5 tierů + Logistics matrix kanonizovány v GLOSSARY. FVP (S26 KISS) drží pouze dvě ploché suroviny `solids` a `fluids`. P2+ rozpracování:

- [ ] **Resource subtypes** — rozštěpit `solids` → `{ metal, components, … }` a `fluids` → `{ water, coolant, … }`. Vrátit M:N reference Module/Bay → subtypy v `ResourceRecipe`. HUD bary zůstávají per kategorie (worst-of subtypů), tooltipy rozepíšou detail. V S25 návrh hotov, v S26 stažen do P2+ jako KISS.
- [ ] **Item registr** — každý konkrétní item má `{ name_cs, name_en, rarity, category, unit }`. Mapování subtypů → konkrétní items.
- [ ] **Capsule drop tabulky** — drop chance per rarity tier (Common 60% / Uncommon 25% / Rare 10% / Exclusive 4% / Epic 1%, kalibrace TBD).
- [ ] **Market** — commodities exchange s cenami per rarity tier (volatilita Common low → Epic enormous).
- [ ] **Conveyor / Pipeline moduly** — dedikovaná doprava per skupenství.
- [ ] **Storage rozdělení** — Silo (solids bulk) / Tank (fluids) / Crate (small batch). Současný `Storage` je generic placeholder.
- [ ] **Recipe rozšíření** — vyšší moduly vyžadují konkrétní items per rarity (Engine v3 = Titan, Reactor = Uran, …).
- [ ] **`formatScalar` jednotky** — kg/t pro Solids, l/m³ pro Fluids (rozhodnout: per-subtyp metadata vs. jeden univerzální formátovač).
- [ ] **Recyklace výtěžek per rarity** — Common rozložitelné, Epic story-grade neodbouratelné.

## Konsolidace global tuning (S18)

- [ ] **Vytvořit `apps/client/src/game/tuning.ts`** — sjednotit všechny laditelné parametry (CAL-*, prahy, ranges, seed values) na jednom místě. Přesunout z `world.ts`: `WEAR_MIN/MAX`, `CRITICAL_RANGE`, `MEDIUM_RANGE`, `MINOR_RANGE`, `START_DAMAGES_COUNT` (hardcoded `3` v `applyRandomDamages`), seed resources (food=40, air=100, coin=20 nyní hardcoded v `createInitialWorld`), `ENERGY_SEED/MAX`. Z `palette.ts` přesunout `THRESHOLD_CRIT_PCT/WARN_PCT`. Katalogy (`MODULE_DEFS`, `ACTOR_DEFS`) zůstávají v `model.ts`. Cíl: jeden zdroj pravdy pro playtest kalibraci.

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
- [ ] **Q14:** Cena a mechanismus *Orbital Shift* (kolik Coin ◎, jaké hlasování, jak dlouho trvá). Rozšíření: v R1 Belt Network = pohyb mezi vertikálními vrstvami.
- [ ] **Q15:** Století Earth reference (může zůstat otevřené, viz T1 prequel tenet).
- [x] **Q17 (S6):** Rozsah P1 POC — **single-player puzzle**, SHIP = 1 segment, krize Únik vzduchu + Engine→Dock, WIN/LOSS s 1 pokusem. Plný zápis: `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)*.
- [x] **Q-P1-Arch (S7):** Architektura P1 = **pure client, static hosting** (Phaser+TS+Vite, GitHub Pages / Netlify). Žádný server, žádná DB, žádný log. Plný zápis: `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §12.
- [x] **Q-P1-Telemetry (S7):** Žádný event log v P1. Feedback mimo hru (rozhovor s P1–P4). Důvody v `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §12.
- [x] **Q-P1-Input (S7):** Task-oriented input (hráč zadává cíle, engine přiřazuje drony). Micro override povolen. Viz `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §15.
- [x] **Q-P1-Character (S7):** Hráč = aktér-drone s W=8, v P1 vždy `working`, prohrává s kolonií. Narativně probuzený Founding Colonist #1. Viz `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §3+§13.
- [x] **Q-P1-Tick (S7):** Logický tick = 250 ms (4×/s), render na rAF. `TIME_COMPRESSION 240×` → 1 game hour = 60 ticků. Viz `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §14.
- [x] **Q-P1-UI (S7):** Wireframe: 1280×720 baseline, horizontální 8×2 segment, pravý sloupec Task Queue + Inspector, levý Actors, horní HUD, dolní Log. Ikony Tabler (free MIT). Viz `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §16.
- [x] **Q-P1-Onboarding (S7):** Diegetický onboarding, prvních 30 s. Klik „Probuzení" → HULL BREACH → 2 contextové bubliny → task. Tón: suché military/tech reporty. Viz `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §17.
- [x] **Q-P1-Dialogs (S7):** Závěrečné dialogy — 2 WIN varianty (A základní, B s bonusem) + 3 LOSS varianty (air-A, air-B, food-B). Struktura header/narativ/signature/footer. Viz `POC_P1.md` *(retirován S32 — klíčová rozhodnutí v MINDMAP.md / GLOSSARY.md)* §18.

## Otevřené otázky z S5 (Prostor, čas, energie)

- [ ] **Q-Energy-Calibration:** konkrétní WD náklady akcí (stavba Greenhouse, SolarArray, Habitat), W dronů ostatních rolí. Ladit v P1 playtestu.
- [ ] **Q-Homeless-Modifiers:** o kolik oddálí HP drain kvalitní strava / relax / léčení. Baseline = 1 HP / herní hodina.
- [ ] **Q-Decay-Rate:** trvání DEVELOPED → DECAYING → LOST bez údržby. Návrh 3–7 dní hry.
- [ ] **Q-Day-Length:** potvrzení 16 h herního dne vs. 8 h (ladit s rytmem session).
- [ ] **Q-Time-Compression:** finální poměr wall/herní čas (provisional 16×, tj. 1 h wall ≈ 1 herní den).
- [ ] **Q-Capsule-Timeout:** timeout pro auto-recyklaci (hodiny / 1–2 dny). Závisí na aktivitě kolonie.
- [ ] **Q-Greenhouse-Size:** rozměr Greenhouse modulu (kolik bays = kolik jídla / den pro kolik lidí).
- [ ] **Q-Observatory-Trigger:** konkrétní práh výzkumu pro spuštění Observatory Event.

## Kalibrační otázky P1 (CAL-*) — RETIRED S20/S21

Celá sekce je **retirovaná** společně s P1 single-player puzzle scopem (pivot na Perpetual Observer Simulation, S20/S21). Únik vzduchu + Engine→Dock scénář neplatí. Nová kalibrace patří k FVP Observer Edition (decay rate, asteroid damage, QM protokol) a je rozptýlená v `tuning.ts`.

## POC projekty k ověření

- [x] **P1 POC — Single-player puzzle** — **RETIRED S20/S21** pivotem na Perpetual Observer Simulation. WIN/LOSS nahrazeno sandbox simulací bez terminálního stavu.
- [ ] **Art pipeline** — asset pipeline pro FVP už částečně existuje (`scripts/build-assets.ps1`, `scripts/recolor-to-palette.ps1`). Rozšíření (VFX, audio) v Release 2+.
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
- [ ] **Capsule economy** — kalibrace výnosu recyklace (Energy + Coin množství).
- [ ] **Výzkumný strom** — kdy / jak se odemyká auto-hunting kapslí.
- [ ] **Forgiveness-rewarded mechaniky** — konkretizovat jak ekonomika/politika/justice realizují Tenet T4.

## Design art (G1)

- [ ] Napsat prompty pro arena.ai (prstencová estetika, V6 setting).
- [ ] Vyběhnout prompty přes více modelů, porovnat.
- [ ] Uložit winner outputs do `art/reference/`.

## HelloWorld pilot (G2) — re-scope po Q-P1-Arch + Q-P1-Telemetry (S7)

Původní plán počítal s Colyseus+WS, pak s Express thin serverem. Po rozhodnutí no-log/no-DB odpadá i backend. Finální re-scope:

- [x] **Lokální skeleton (S8):** pnpm monorepo, `apps/client` (Vite 5 + Phaser 3.87 + TS 5.6 strict), žádný server. Build + dev server běží.
- [x] **Push na GitHub** `mrklas69/Voidspan` (S17).
- [x] **Deploy na GitHub Pages** (S17) — auto-deploy workflow, artifact-based.
- [x] **Sdílitelná URL pro P1–P4** (S17) — https://mrklas69.github.io/Voidspan/

## HP-unified damage axiom (S16)

Sjednocení konstrukce / dekonstrukce / opravy / poškození do jedné osy HP. Detail: `IDEAS.md` → „HP-unified damage axiom". **Repair branch implementován v S16, build/demolish/asteroid otevřené.**

- [x] **Model refactor — Bay:** Bay.empty/damaged mají hp+hp_max (S16).
- [x] **Model refactor — Module instance:** hp_max na instanci, kopie z MODULE_DEFS při create (S16).
- [x] **Damaged overlay vizuál:** červený fill alpha úměrná 1-hp/hp_max (S16).
- [ ] **Task engine — build/demolish nad HP:** repair hotov, build/demolish tasky pořád nemají HP sync. Aktivovat při implementaci §15 stavebního UX.
- [ ] **Asteroid damage vzorec** — rozpracovat (viz IDEAS). Zatím placeholder: hit → `-5 hp`.
- [x] **Multi-bay sprite rendering (S17b):** Engine 2×2 — `drawBaySprite` přes spanW/spanH, root kreslí celou texturu, ref skryjí sprite.
- [ ] **Ship render — damage particles** (S35 follow-up) — Phaser.GameObjects.Particles burst při `flashUntilTick` (asteroid hit). Dnes: solid red rect overlay. Particles: orange sparks, 2 s burst, ~30 částic. Lepší dojem, +30-50 LOC, GPU cost OK pro single-burst (ne continuous). Odloženo z S35 — styl priorita, particles ledování.

## Player mode (P2+)

- [ ] **Player mode** — per-actor HP a osobní inventář (◎, food) v datovém modelu. Rozšířit `Actor` o `hp`, `inventory`. Implementovat HP drain (CONST_HOMELESS_HP_DRAIN). Observer vs. Player axiom viz `GLOSSARY.md` §UI Modes.
- [ ] **Mode switch UX** — hotkey toggle nebo zoom-level (mapa beltu → colony Observer → actor Player). Top Bar reskin: Observer = kolonijní agregáty, Player = osobní stavy.
- [ ] **Floating panel *Kolonisté* [K]** — seznam aktérů s per-actor HP / inventory sparkline (první krok před full Player mode).

## Infrastruktura (po rozhodnutí Q17)

- [ ] Objednat Forpsi VPS Linux Basic (až bude POC lokálně + na Renderu funkční).
- [ ] Přesměrovat DNS `bete1geuse.com` na VPS IP (A záznam).
- [ ] Zvážit zrušení Easy hostingu po přechodu na VPS.
- [ ] Nastavit systemd service + git pull deploy.
- [ ] Caddy reverse proxy + auto HTTPS.
- [ ] Založit složku `art/` pro 8-bit grafické návrhy.

## Stack — rozhodnuto

**FVP scope (pure client, static hosting):**
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
