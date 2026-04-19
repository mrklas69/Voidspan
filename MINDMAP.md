# MINDMAP.md — ⊙ Voidspan

Myšlenková mapa projektu. Slouží k nalezení fokusu: **kde máme maso, kde díru, co je záclona a co základ**.

Aktualizuj kdykoli se změní struktura projektu (nový bod, přejmenování, přesun). Stav naplnění značí, kolik je v dané větvi skutečně rozhodnuto.

**Legenda stavu:** `[●]` plné / `[◐]` rozpracováno / `[○]` prázdno / `[✕]` zrušeno.

Verze: **v4.8** (2026-04-19, konec sezení 40 — **Osa 2 etapa 1+2: shared extrakce + server POC lokálně + WS protocol + flat JSON persistence**). Hlavní změny:
- **`packages/shared/` extrakce** — nový workspace balíček `@voidspan/shared` (ES2022, lib jen ES2022, headless-safe). Git mv zachoval history. Přesunuto: `model.ts`, `events.ts`, `tuning.ts`, `model.test.ts`, `world.test.ts`, celá `world/` (31 souborů). Barrel `src/index.ts` re-exportuje vše přes `export * from ...`. Kolize fix: `world/index.ts` odstranil duplicate re-export tuning konstant (`TICKS_PER_GAME_DAY` etc.), barrel je re-exportuje přímo z `./tuning`.
- **Klient 14 souborů — import refaktor** `./model|events|tuning|world` → `@voidspan/shared`. Sed bulk přes `find + sed -i -E`. Pozor: sed přepsal EOL CRLF→LF v 11 ne-matched souborech, vráceno `git checkout`. `format.ts` (UI scalar/resource/renderBar) **zůstává v klientovi**, není sdílený.
- **Dependency setup** — `apps/client/package.json += "@voidspan/shared": "workspace:*"`. pnpm 10.33 vyžaduje semver version (fix: bump shared `1.1` → `1.1.0`, klient zůstává 1.1). Symlink `node_modules/@voidspan/shared → packages/shared`.
- **`apps/server/` POC** — nový workspace balíček `@voidspan/server` (Node ES2022, ws + tsx + @types/node + @types/ws). 3 moduly (~300 LOC total): `server.ts` (main loop), `persistence.ts` (flat JSON), `smoke_client.ts` (manual QA).
- **WS protocol v `packages/shared/src/protocol.ts`** — `SCHEMA_VERSION = 1`. Server → Client: `HELLO` (full world + recentEvents[500]), `SNAPSHOT` (tick + full world dump každých 10 ticků), `EVENT` (single mid-tick), `PONG` (keep-alive reply). Client → Server: `PING` (heartbeat). Žádný SPEED/DECISION v POC (klient neposílá).
- **Persistence** — `saveWorld(w, path)` atomic write temp+rename. Wrapper `{ schemaVersion, tick, savedAt, world }`. `loadWorldOrNull` — při mismatch/missing/corrupt vrací null → server `createInitialWorld()` (Q5 nuke & restart). Auto-mkdir `./data/`. Save interval 30 s + extra save při graceful shutdown.
- **Server main loop** — `setInterval(stepWorld, 250)`. Per-tick: zapamatuj `eventCountBefore`, volej stepWorld, broadcast nové eventy individuálně přes `w.events.slice(before)`, každých 10 ticků full SNAPSHOT. WebSocketServer port 3000, `Set<WebSocket>` clients, on connection send HELLO. SIGINT/SIGTERM graceful shutdown: clearInterval × 2 + saveWorld + wss.close + exit.
- **Ověřeno:** smoke client obdržel HELLO + PONG + 2× SNAPSHOT (tick 90, 100, interval 10 přesně). Persistence: `tick=115 saved` → `tick=230 saved` → restart `[persistence] načten snapshot tick=461` — svět pokračuje, ne reset.
- **Osa 2 Q1-Q6 rozhodnutí zapsána do IDEAS:** Q1 flat JSON (v1.1), Q2 shared world → C hybrid v R2, Q3 full snapshot + ring buffer 500, Q4 no auth (SPEED client-side, DECISION first-come), Q5 nuke & restart, Q6 VPS + Caddy + subdoména + GitHub Pages fallback.
- **Pre-existing S39 bugs odhaleny `tsc --noEmit`** (S39 spouštěl jen vitest) — `ui/decision_modal.ts` + `ui/milestone_ack_modal.ts` volali `Text.setColor(COL_AMBER_BRIGHT)` (number) místo string. Swap na `HEX_AMBER_BRIGHT`. `sacrifice.test.ts` unused import `enqueueBuildTask` smazán.
- **Testy beze změny** — 183/183 stále zelených (shared 149 + client 34, migrace nezměnila počet). TS strict clean napříč 3 balíčky. Vite bundle 1.56 MB beze změny.
- **Server běží lokálně** na `ws://localhost:3000` (HTTP GET vrací 426 Upgrade Required — očekávané, není HTTP endpoint; prohlížeč přímo neotevře, potřebuje WS klienta).

Verze: **v4.7** (2026-04-19, konec sezení 39 — **Smart QM priority engine + demolish/build runtime + wake-up mechanika + DSL rules + Harvester + milestone advance**). Hlavní změny:
- **Smart QuarterMaster priority engine** — `pickNextTarget(w, materialGated)` v `world/protocol.ts`. 6 priorit (CRIT repair > live repair > live build > live demo > nový Engine demo > normal repair). Pod material gate priority 1/2/3/6 skip (repair/build nemohou čerpat zdroje), priority 4 live demo + 5 **rescue Engine demo** (recovery přinese Solids). **Dvoufázový pause gate:** `globalPauseReason` (offline/low E/no workers) pauzne vše; `materialPauseReason` (no Solids/Fluids) pauzne jen repair+build, demo běží.
- **Demolish runtime** — `enqueueDemolishTask(w, moduleId)` + progressTasks/completeTask demolish větve. HP klesá lineárně z `Task.initialHp` k 0 přes `wd_done/wd_total`, žádný material gate. Při completion bays → void, modul smazán, recovery `(initialHp / hp_max) × recipe × DEMOLISH_RECOVERY_RATIO (0.5)` vrácen do skladu (`returnResources`, clamp MAX). One-shot `World.engineDemoEnqueued` flag brání cyklu.
- **Build runtime** — `enqueueBuildTask(w, kind, rootIdx)` + progressTasks/completeTask build větve. Validace void bays + segment bounds. Vytvoří Module instance (`status: "building"`, `hp: 0`), obsadí bays, konzumuje recipe per-tick (material gate), HP roste 0 → hp_max. Completion = `status: "online"`. `generateModuleId` + `KIND_ID_PREFIX` (dock_1, harvester_1, …).
- **QM Rule engine (DSL v0)** — `world/rules.ts`. `QMRule = { id, dsl, when, then }`. `FVP_RULES` (2 pravidla): `post-engine-demo-build-dock` + `post-dock-build-harvester`. DSL text syntax jako aspirační komentář (parser P2+), evaluator iteruje v protocolTick. Scripted narativní beats bez hard-coded logiky v protokolu.
- **Kapitán wake-up + DecisionModal** — první hráčská interakce ve FVP. `isDeadlocked(w)` detekuje material gate + engine demo done + paused build/repair. `triggerCaptainDecision` nastaví `pendingDecision: "sacrifice-for-build"` + first-time `captainAwake = true` + player cryo → idle + SYST:CRIT event. `getSacrificeCandidates` filtruje online non-Engine non-blacklist (Habitat/MedCore/CommandPost) moduly, sort desc podle total recovery. `DecisionModal` auto-open s dynamickými tlačítky per kandidát („SolarArray (solar_2) → +20 Solids"), klik = `chooseSacrifice` → demolish → recovery → paused build resume.
- **Milestone auto-advance + ack modal** — `advanceMilestones(w)` v protocolTick. Per-milestone TRIGGERS (`repairs → isRepairsDone`, `dock_build → dock_1 online`, `first_wake → captainAwake`). Status flip current → done + `acked = false` + `date_cs = formatGameDateCs(w.tick)` (dynamic datum dokončení). Chain: first planned → current + `date_cs = formatGameDateCs` (datum zahájení — dočasně, při vlastním advance se přepíše). `Milestone.acked: boolean` field distinguishuje seed done (acked=true) vs. runtime advance. `MilestoneAckModal` auto-open při `firstPendingAck`, title „MILNÍK SPLNĚN", [OK]+Enter/Space/ESC → acked=true. **Shared handler reference** fix opraveil bug opakovaného modal.
- **Milestone restructure (P1 FVP scope)** — `+departure` first done („Zahájení cesty" 1987-09-12, narrative 400letý transit z Země). `−arrival` (R2 scope). `first_wake` je terminal P1 beat s captainAwake triggerem. 7 milníků: 4 done + 1 current + 2 planned.
- **AsteroidHarvester modul + Poisson** — nový `ModuleKind.AsteroidHarvester` (1×1, −5 W, recipe 60S+10F, max_hp 600). Production per game hour Poisson sample: `λ = 3 × hpRatio`, clamp [0, 5], output Solids. `world/harvester.ts::harvesterTick` v pipeline slot 7b. `world/random.ts::poisson(lam, maxYield)` — port z PocketStory (Knuthův algoritmus). Ikona `asteroid-harvester.svg`.
- **Decay busy loop fix** — `QM_FULL_HP_TOLERANCE_PCT = 1 %` tuning konstanta. `findMinHpTarget` + `anyDamagedModule` ignorují sub-procentní decay drift. Pre-fix: QM v busy loopu priority 6 (modul na 499.99/500 = damaged striktně), priority 5 Engine demo nikdy nedostane šanci (4 day delay bug).
- **Offline guard generalizováno** — non-online moduly (offline/building/demolishing) skipnuty v `findMinHpTarget` + `anyDamagedModule`. Pravidlo „QM neopravuje offline moduly" platí obecně (Engine seed + runtime offline decay/asteroid).
- **ModulesPanel offline barva** — izomorfismus s ShipRender. Offline řádek = `HEX_METAL_GRAY` místo `RATING_COLOR[statusRating(hpPct)]`. Engine v obou pohledech teď svítí stejnou grey.
- **Milestone bar styling + centering** — **bug fix „milník nezezelenal":** `render()` nyní dynamicky re-applyuje label + barva + alpha podle `chip.lastStatus` cache (dřív static po init). Cluster centrování: po 3 iteracích user zvolil **zrušit shift** — cluster jako celek centered, current drží highlight přes pulse + barvu. Current chip barva: `HEX_AMBER_BRIGHT → HEX_WARN_ORANGE` (rate-2 semaforová oranžová).
- **Time axes dokumentace** — FVP má dvě osy: T (16h game day) + kalendář (24h, base 2387-04-25.09:24). Nesoulad od prvního day-rolu je očekávatelný. V persistent serveru (Osa 2) bude kalendář nahrazen reálným serverovým časem. `formatGameDateCs(tick)` helper v format.ts. Komentáře v kódu + IDEAS.md Osa 2 „Time axes unification" zápis.
- **Unit testy +59** — `demolish.test.ts` (8), `build.test.ts` (11), `sacrifice.test.ts` (12), `milestone.test.ts` (10), `harvester.test.ts` (12), `protocol.test.ts` (+6 priority/rescue), `world.test.ts` (+0 update). **183/183 zelených.**
- **TS strict clean**, HMR jel celé sezení.

Verze: **v4.6** (2026-04-19, konec sezení 38 — **v1.1 + Milestone bar + DRY refactor + dead code cleanup + audity**). Hlavní změny:
- **v1.0 → v1.1 bump.** Release label v `package.json` root + client, `PLAYTEST_GUIDE.md` header, `terminal.ts` QM Terminal první řádek („Voidspan v1.1 Observer Edition").
- **Milestone bar** — nová UI komponenta (`ui/milestone_bar.ts`, ~170 LOC). Horizontální strip nad Bottom Barem. 7 chips: **3 done (✓ zelené) + 1 current (⧖ amber pulse) + 3 planned (○ dim)**. 6 separátorů `»` (HEX_AMBER_DIM) mezi chipy. Souvislý strip-bg. Hover tooltip = 2 řádky (`label datum\ndesc`). Pulse perioda 2 s, izomorfní s ship_render activity pulse.
- **Milestone data model** — `Milestone` + `MilestoneStatus` typy v `model.ts`. `World.milestones: Milestone[]` (7 prvků, pořadí = timeline). `createInitialMilestones()` factory v `init.ts` (Transit arc: Establish → Kontroly → Stabilizace orbity → Oprava systémů [current] → Dokončení oprav → Probuzení posádky → Příchod Teegarden).
- **QM Terminal DRY refactor** — `buildTerminalBody(w)` čte `w.milestones`, status → ASCII tag (`[OK] / [Probíhá...] / [—]`). **Retire**: odsazené runtime briefing řádky (SEED_CREW_CRYO kolonistů, MedCore online, Engine offline, Energie/Práce/Pevné/Tekuté). Kvintet Top Baru + milestone bar nesou stejnou info live.
- **Paused task reason text** — `(paused — no Solids)` / `(paused — low Energy)` / … v TaskQueue suffixu. Nový `protocolPauseReason(w)` helper v `world/protocol.ts` — **jediný zdroj pravdy** sdílený s QM eternal monitor labelem + TASK:PAUSE event textem (DRY). Priority chain: offline → low E → no workers → `no {Solids|Fluids}`.
- **Protocol vs. progressTasks unified scale** — nový `estimateRepairHpDeltaPerTick(w)` helper v `world/recipe.ts`. `firstMissingRecipeCategory` používá **aktuální hp_delta per tick** místo `RECIPE_MIN_HP_EPSILON` (0.01). **S38 bug fix**: při 0.048 Solids protokol správně pauzne (dřív false negative → task vypadal `active`, bar stál tick po tick bez progresu).
- **ModulesPanel stats right-anchored** — `statsText` origin (0, 0) → (1, 0), x = `contentW`. Izomorfismus s TaskQueue suffix layoutem (S29). Ellipsize budget dynamický per-row.
- **Kvintet integer rounding** — `formatResource` zaokrouhluje `current` i `max` na integer (`Math.round`). W přes `Math.round(powerAvailable)`. Coin přes `Math.round(w.resources.coin)`. Sub-integer (0.048) už neukazuje `48m` milli prefix v monitoring kvintetu.
- **Particles prototyp → IDEAS** — damage particles experiment (hit burst sparks + shards + crystals, continuous damage debris, beztíže `gravityY: 0`) prototypován ~130 LOC a revertován. Zapsáno v `IDEAS.md` jako „Damage particles (S38 prototyp, přesunuto sem)" s lessons learned + návratové triggery (gameplay hook / scripted events / Player mode / audio).
- **Dead code cleanup** — `ui/actors.ts` (130 LOC) + `ui/panel_header.ts` (30 LOC) smazány (ActorsPanel skrytý S19, import nikde). `ui/layout.ts`: retire exportů `ACTORS_W`, `ACTORS_X`, `COL_PANEL_BG`; `MID_Y`/`MID_H` pouze interní. `modal.ts::PANEL_BG_ALPHA` duplikát nahrazen importem z `panel_helpers.ts`.
- **v1.1 Roadmap v IDEAS.md** — 3 osy: Osa 1 Milestone bar (done S38), Osa 2 Persistent server (plán, Colyseus vs. plain WS srovnání + doporučení plain WS + JSON pro POC + protokol draft), Osa 3 i18n AJ/ČJ (plán, gender/plural challenges, helper design, ~500 strings).
- **Readonly annotations** — `rowPairs`/`fullRows` (task_queue), `moduleRows`/`fullRowData` (modules_panel), `chips`/`separators` (milestone_bar) — `private readonly` (static safety).
- **@AUDIT:CODE + @AUDIT:DOCS (S38)** — CODE 8.2/10 (po fixech všechny 3 dluhy vyřešeny: +20 testů, readonly, magic number dokumentace). DOCS 5.4/10 initial → po fixech: PLAYTEST_GUIDE milestone bar + Kredit→Coin, GLOSSARY Milestones sekce, SPECIFICATION S38 changelog, DONE S38 zápis, ActorsPanel retire dokumentován.
- **Unit testy (+20)** — `world/recipe.test.ts` (8 testů, vč. regression `unified scale @ 0.048 Solids`), `world/protocol.test.ts` (7 testů, všechny 4 priority větve + chain order), `world.test.ts` (+5 testů `createInitialMilestones` shape). **124/124 zelených.**
- **TS strict clean**, HMR jel celé sezení.

Verze: **v4.5** (2026-04-19, konec sezení 37 — **v1.0 Observer Edition release + Time speed + Event system redesign + Collapse epitaph**). Hlavní změny:
- **v0.9 → v1.0 Observer Edition bump.** Release label v `package.json` root + client, `PLAYTEST_GUIDE.md` header, `terminal.ts` QM Terminal první řádek („Voidspan v1.0 Observer Edition"). Top Bar meta text čte `pkg.version` — zobrazí v1.0 automaticky.
- **Time speed control** — `TimeSpeed = 1 | 10 | 100 | 1000` (model.ts), `World.timeSpeed` (default 1, in-memory, reload resetuje). `GameScene.update`: `accumulator += delta * world.timeSpeed` násobí efektivní tick rate (×1000 = ~4000 ticks/s wall). `SpeedPopover` (nový `ui/speed_popover.ts`, ~115 LOC) — minimalistický float pod herním časem v Top Baru, 4 tlačítka s cyan highlight aktivního, klik mimo/ESC/volba zavře. Meta text suffix `×N` jen když >1 (KISS, ×1 = chrome noise). ESC chain rozšířen o popover jako vyšší priorita než panely.
- **Event system redesign — „verb = ikona, text = subjekt"**. Ikona nese akční sémantiku, text drží jen subjekt. `eventIcon(ev)` csq-aware helper v `events.ts` (TASK:START/RESUME → `>`, TASK:PAUSE → `||`, ostatní z VERB_CATALOG). Texty zkráceny napříč: CMPL „Dokončena oprava" → „oprava", ASSN „Přiřazen col_03" → „col_03", TASK:PAUSE „Pozastavena oprava — low E" → „oprava — low E", DECY „Zničeno rozpadem" → „zničeno", DMG „Asteroid zasáhl X — ztráta Y" → „Asteroid −Y". `TASK_VERB_CS` (infinitivy „Opravit") → `TASK_NOUN_CS` (ženská substantiva „oprava" — gender agreement s gender-flexibilními prefixy).
- **`taskLoc(task)` helper + `[Kdy, Kde]` konzistence** — nový helper ve `world/task.ts` vrací `moduleId ?? bay{idx}`. Konzumenty: ASSN + CMPL (task.ts), TASK:PAUSE/RESUME/START (protocol.ts, 4×). Event log hlavička `[Kdy, Kde]` vyplněna všude, kde je lokace zřejmá. Ostatní eventy (DRN, SYST, SIGN globální) zůstávají bez loc správně.
- **Collapse epitaph — `world/collapse.ts` (nový, slot 6b v pipeline).** Detekce: všichni aktéři `state === "dead"`. One-shot guard `World.collapseEmitted: boolean` (default false v init.ts). Emit `SYST:CRIT` event: „Kolonie ztracena. 32 mrtvých. Simulace pokračuje." Severity mapping rozšířen v events.ts (`CRIT_ON_CRIT` set → SYST:CRIT = crit barva). Dává pointu narrative arc „autopilot drží systém naživu do úplného vyčerpání zdrojů" bez porušení Observer axiomu (čas plyne dál). 3 nové unit testy (neemituje před smrtí / emituje jednou / one-shot drží).
- **Semafor konzistence audit (user Q) — OK s drobným dluhem.** Jediný zdroj pravdy `palette.ts` §2b + `model.statusRating(pct)`. 8 konzumentů (header, info_panel, modules_panel, ship_render, event_log SIGN, world/status.ts, world/protocol.ts, task_queue). Drobný dluh: prahy 60 a 80 jsou magic numbers v `statusRating()`; tuning.ts má jen 15/40. Zanechán na P2+.
- **TaskQueue `active`: orange → cyan (S37 styl rewrite).** User namítl kolize task status oranžová s HP rate-2. Fix: `HEX_COOLANT_CYAN` — cyan mimo rating paletu, v task kontextu znamená „probíhá bez problému". Paused zůstává amber (akceptovatelná kolize, krátkodobá anomálie = „zvuk" rating palety).
- **EventLog 2 bugy současně opraveny:** (a) **wheel scroll nikdy nefungoval** — `bg.on("wheel", (_p, _dx, _dy, dz))` četl `deltaZ` (4. pozice, vždy 0) místo `deltaY` (3. pozice); (b) **bg-level listener fragile** když pointer nad scrollbarem/Text. Fix: scene-level wheel listener + bounds check — izomorfismus s InfoPanel/ModulesPanel. Plus (c) **chip dirty gate bug** — `events.length !== lastRenderedCount` selhával při nasycení ring bufferu (push + shift konstant. length). Nový verb (první DMG po asteroidu) se nedostal do chipů. Fix: zrušen length gate, `seenVerbs` re-populate z bufferu každý frame (O(500) Set.add = μs), `rebuildChips` interní gate přes size diff.
- **`FloatingPanel.isPointerInBounds(pointer)` extrakce** (z /simplify REUSE). Eliminuje inline bounds duplicitu napříč EventLog + InfoPanel + ModulesPanel scene-level wheel handlery. Automaticky v sync s `computePosition()`.
- **@AUDIT:CODE + @AUDIT:DOCS (2026-04-19)** — paralelní Explore agenti. CODE 8.5/10; 1 reálný dluh: `progressBar` (task_queue) vs. `renderBar` (format.ts) duplicita → konsolidováno. DOCS: `art/README.md` Hull & Amber + PNG pipeline moduly (retired S35/S36) → Neon paleta + procedural reference; `PLAYTEST_GUIDE.md` +[H]elp + Rychlost času sekce; `SPECIFICATION.md` header 2026-04-19 full S14-S37 changelog.
- **103/103 testů zelených**, TS strict clean, HMR jel celé sezení.

Verze: **v4.4** (2026-04-18, konec sezení 36 — **SegmentPanel retire + findActiveTaskForModule extract + cestovní layout s 4 void na čele + Solar upgrade axiom**). Hlavní změny:
- **SegmentPanel definitivně retire** — `apps/client/src/game/ui/segment.ts` (298 LOC) smazán, `USE_PROCEDURAL_RENDER` flag + §11 v `tuning.ts` pryč, GameScene dispatch `ShipRender | SegmentPanel` zjednodušen na `ShipRender` přímo. 8× PNG v `public/assets/modules/` smazáno (art/modules/ zdroje ponechány). Preload blok `AVAILABLE_MODULE_ASSETS` + loop retire. ShipRender je jediný renderer, žádný fallback.
- **Dead data cleanup po PNG retire** — `asset: string` pole z `ModuleDef` + `ActorDef` typů, 9 `asset: "..."` hodnot (8 modulů + ActorDef.player), 2 test assertions (filename konvence + length check), `BAY_NATIVE = 40` + `BAY_SCALE = 2` konstanty z `layout.ts` (používal jen smazaný segment.ts). Hlavička `layout.ts` BAY_PX teď direct `80` s komentářem o historické derivaci.
- **`findActiveTaskForModule` + `isConstructionTask` extract** — rule-of-two deferred z S35 simplify passu. Helpery v `world/task.ts`, re-export z `world/index.ts`. Konzumenty: `ship_render.ts` preflight Set builder (`isConstructionTask(t)` místo inline triple `t.kind !==` check), `ship_render.ts` `repairStateText` (helper + redukce switch — completed/failed už nemůžou vrátit), `modules_panel.ts` `moduleTaskState` (helper nahradí `tasks.find(…)`).
- **Stavebnice — design iterace (1: multi-bay attempt, 2: cestovní minimalist)**. První pokus podle MINDMAP §1 (CP 2×2 + SolarArray 2×1 × 2 + full 16-bay coverage) user zavrhl: *„Vrať původní rozměry. Je to cestovní minimalistické rozložení, obrovské zásoby a záloha energie. Neobsazené 4 sloty na čele lodi, musou první zastavěné."* Finální rozhodnutí: FVP není endgame, je to tranzit konfigurace — 32 v cryo, 400 let cesty k Teegardenu, prostorová redundance víc než hustota.
- **Finální layout (deterministický, žádný shuffle):**
  ```
  Col:  0  1  2  3  4  5  6  7
  Row0: .. .. So So St St En En   (energie + zásoby = backup systémy nahoře)
  Row1: .. .. Hb Mc As CP En En   (obytné + utility dole)
  ```
  9 modulů (Engine 2×2 + 8× 1×1), 4 void na čele lodi (cols 0-1 = idx 0/1/8/9). `shuffleInPlace` + `BODY_IDXS` drop z `createInitialWorld`, hardcoded `START_MODULES` tuple `[id, kind, rootIdx]` (rootIdx určuje pozici, pořadí v poli jen pro čitelnost). Docstring init.ts přepsán s narativní vazbou (cestovní minimalist, expansion space na čele).
- **Tabler ikony beze změny** (user explicit: *„stejná velikost, vždy centrované"*) — fixed 48 px raster přes Phaser SVG loader, centered via `x + (spanW * BAY_PX) / 2`. Žádné scaling per module size.
- **Solar upgrade axiom — IDEAS zápis.** User: *„Po výzkumech a upgrade bude solar 2×2 s desetinásobnou produkcí než 1×1."* Kód beze změny (FVP drží 24 W). Zapsáno do `IDEAS.md` jako **Module research & upgrade paths (S36)** za QuarterMaster upgrade path (izomorfismus ladder kánonů). Obsah: Solar 1×1→2×2 10× prod (24→240 W), Storage/Habitat/MedCore expanze kandidáti, Q1-Q5 (rebuild vs. in-place / cost / prereq / reverz / visual), narativní vazba „4 void na čele = expansion space, upgrady po příjezdu".
- **Testy update** — `world.test.ts` invariants přepsány na deterministický layout: 9 modulů (dřív „Engine + 8"), 4 void na konkrétních indexech `[0, 1, 8, 9]` (dřív random count-only), `storage_2` zachován (S35 iter 1 ho dropnul, iter 2 vrátil). 100/100 zelené (S35 bylo 101 — 1 test smazán s asset asserty, správně).
- **Net LOC delta: −~460** (segment.ts 298 + dead data 160+). `pnpm build` clean, HMR OK celé sezení.

Verze: **v4.3** (2026-04-18, konec sezení 35 — **Neon paleta + procedural ship render (ShipRender) + Tabler SVG ikony + semafor barva modulů**). Hlavní změny:
- **Paleta přepsána na Neon** (palette.ts). 5 rating tónů z neon výbojkové rodiny: rate-5 electric mint-lime `#39ff5e`, rate-4 **acid lime-yellow `#b8ff2e`** (S35 přemapování z cyan), rate-3 solar amber `#ffb020`, rate-2 hot plasma orange `#ff6a1f`, rate-1 sodium plasma red `#ff2850`. Cyan zachován jako Storage/Fluids kanon (`UI_STATUS_COOLANT`, `HEX_KIND_STORAGE`), ne rating barva. UI amber saturovanější (`#ffd060 → #ffd94a`). VOID_BLACK `#0a0a10 → #000510` (jemný modrý nádech). Canvas BG `#000000` (pure black, neony lépe vyniknou).
- **Nová sekce §1b: KIND_* konstanty** — 8 per-module identity hue (Habitat orange, Solar yellow, Storage cyan, Assembler magenta, Dock azure, Engine mint teal, MedCore cryo blue, CommandPost neon violet). Pro budoucí decorative accent. V S35 ship render je ale nepoužito — barva modulu = semafor podle HP%, ne kind.
- **Nový `RATING_COL` + `ratingColorNum(pct)`** — number varianta (paralela k existující HEX `RATING_COLOR` / `ratingColor`). Phaser fillStyle/setTint potřebuje number.
- **`palette-preview.html`** (nový, `apps/client/public/`) — statická reference pro novou paletu: 5 rating swatches s glow halo, 8 per-kind outline karty, 4 status cells izomorfismus (online/damaged/offline/build), UI chrome sample, mapping tabulka starý → nový. Původní `style-guide.html` zachován jako Hull & Amber archiv.
- **ShipRender procedural** (`apps/client/src/game/ui/ship_render.ts`, 433 LOC) — Phaser.Graphics outline + fill + Tabler SVG glyph + asteroid flash + selection. Status modulace: online solid, damaged dashed outline + HP fill zleva, offline grey + checker, building dotted + progress fill. Void = dashed grey + „+" glyph. Sdílí public API se SegmentPanelem (render / relayout / attachTooltips / moveSelection / getSelectedBayIdx).
- **Feature flag `USE_PROCEDURAL_RENDER = true`** v `tuning.ts §11`. Default po S35, SegmentPanel (298 LOC, 8 PNG module assetů) zůstává jako rollback safety net. Cíl: retire v S36 po stabilizaci.
- **Tabler SVG ikony** (MIT, 9 ikon) — `public/assets/icons/{home,solar-panel,package,hammer,anchor,engine,first-aid-kit,broadcast,cube}.svg`. `stroke="currentColor"` → `#ffffff` pro tint compatibility. Mapping: Habitat=home, Solar=solar-panel, Storage=package, Assembler=hammer, Dock=anchor, Engine=engine (Tabler má přímo), MedCore=first-aid-kit, Command=broadcast, fallback=cube. Preload: `this.load.svg("icon:Kind", url, { scale: 2 })`. Fallback graceful degradation pokud textura chybí.
- **Barva modulu = semafor HP%** — izomorfismus s ModulesPanelem (user explicit). Outline + HP fill + glyph tint všechny přes `ratingColorNum(hpPct)`. HP 80 % = rate-5 green, 70 % = rate-4 lime, 50 % = rate-3 amber, 30 % = rate-2 orange, 10 % = rate-1 red. Offline jediná výjimka (grey, ne semafor).
- **Animace active tasku** — moduly s aktivním repair/build/demolish taskem mají outline alpha pulsuje yoyo sin 0.5..1, perioda 2 s. HP fill static (skutečné HP%), ne animovaný. Směr (ascending/descending) se dnes vizuálně neliší (z původní volby po user korekci) — tooltip drží `repairStateText` pro detail. Pulse phase a activeTaskModuleIds Set precomputed 1× na `render()` (ne per-bay).
- **/simplify pass** — 3 agenti paralelně. **Fixed (5):** (1) activeTaskModuleIds Set preflight, (2) pulse phase hoist, (3) drawDashedLine closure retirace → private method, (4) Math.hypot → axis-aligned abs sum (zero sqrt), (5) USE_PROCEDURAL_RENDER komentář konsistence. **Deferred (2):** repairStateText/bayTooltipText duplicate s segment.ts (S36 retire vyřeší), findActiveTaskForModule extract (rule-of-two future).
- **Memory update** — `feedback_numbered_questions.md` rozšířen: číslování Q napříč celou session (ne reset per message).
- 101/101 testů zelených, TS strict clean. `ship_render.ts` 433 LOC (pod LOC cíl ≤500).

Verze: **v4.2** (2026-04-18, konec sezení 34 — **Art pipeline cesta C rollback + AI arena brief + Gemini style extraction mix v1+v2**). Hlavní změny:
- **Cesta C integrační test — FAIL.** Habitat 2048² + hull_tile 1024² shippované přes ad-hoc Python chroma-key pipeline (`scripts/build-assets-hires.py`, Pillow), integrace v `segment.ts` (16 hull sprites + deterministická rotace `(idx × 7) % 4 × π/2` + uniform contain scale × `MODULE_OVERLAY_SCALE = 0.75`, feature flag `USE_HULL_OVERLAY`). User vizuální test: **nefunguje**. Rollback přes `git checkout` pro art/, public/assets/, tuning.ts, GameScene.ts, segment.ts. Staré 40×40 pixel art zpět.
- **Pivot: AI arena brief místo per-modul generation.** Diagnóza proč cesta C selhala: Chris Foss painterly = retro Dune II rip-off, AI generation roulette, asset pipeline overhead, nulové využití Phaser shaderů. Brief (`art/arena_brief.md`) pro arena.ai: self-contained prompt, 3 zóny (header metriky + bottom bar + centrální LOĎ stavebnice), 8 modulů z našeho katalogu, anti-vzory (NASA loď, Chris Foss, generic sci-fi UI), styl jen jako doporučení (neon hologram / blueprint / data-viz / cyberpunk).
- **Arena kolo 1 (Gemini dashboard, `art/arena_winners/gemini_1.png`)** — hit estetika (neon hologram), damage přes particles, funkční modul ikony, affordance labels. Problémy: grid ne 8×2, moduly mimo katalog, CZ typo, event timeline always-on strip, Player mode akce.
- **Arena kolo 2 (Gemini blueprint, `gemini_2.png`, user si vyžádal zjednodušenou verzi)** — dark navy + thin outlines + wireframe decor, plně česky. Damage přes zig-zag + dashed yellow border, OFFLINE přes checkered pattern. Jednotky bug (Wh místo m³/L), stavebnice NEDORUČENA (všechny 1×1), moduly mimo katalog.
- **User verdict: mix v1 + v2.** v2 blueprint klid (base) + v1 glow/particles action (damage/build/completion). Arena uzavřena po 2 kolech, vzato jako nezávazná inspirace.
- **IDEAS: 2 nové sekce** — „Art pipeline pivot — AI arena brief (S34)" s diagnózou/retire list/Q1-Q4 + „Style extraction — mix v1 + v2" s paletou per modul kind (8 barev), status izomorfismem (ONline solid / DAMAGED dashed / OFFLINE checkered / staví se progress), functional glyph ikonami, implementation outline pro S35+ (`ship_render.ts` replace, Phaser.Graphics + FX.Glow + Particles, LOC target ≤500, žádné PNG).
- **Úklid:** retire `art/pokus1.md`, `art/prompts/pokus2/` (8 souborů), `art/prompts/pokus3/hull_tile.md`, `scripts/build-assets-hires.py`. Revert `package.json` alias. Settings konsolidace (přidán `python:*` wildcard, 4 granulární `cp` entries smazané).
- **Technická lekce:** `pnpm build:assets` je dedikovaný na 40×40 pixel art (downscale na 36×36). Pokus o hires assety (1024²+) skrz tento pipeline je prohra bez obcházky. Pokud se k hires někdy vrátíme, `build-assets-hires.py` už neexistuje — je v git history (commit S34 @END).
- 101/101 testů zelených (beze změny), TS strict clean. Code untouched (all rollback success).

Verze: **v4.1** (2026-04-18, konec sezení 33 — **v0.9 bump + audity CODE/DOCS + Mission Scenario + Narrative voice + Art pipeline pivot**). Hlavní změny:
- **v0.8 → v0.9 bump** — package.json root + client, PLAYTEST_GUIDE.
- **QM Terminal `buildTerminalBody(w)`** — runtime substituce placeholderů `{E/W/S/F}` z World, `[Nestabilní!!!]` ASCII tag (modal nepodporuje inline barvu); `SEED_CREW_CRYO` import, `SEGMENT_ADDRESS` konstanta. Při každém [Q] open čte živé metriky.
- **Modal font 20 → 18 (SIDEPANEL sjednocení)** — Help + Terminal mají stejnou hustotu dat jako boční panely. `FONT_SIZE_PANEL` zůstává pro commandButton + ActorsPanel.
- **Blikající kurzor v modalu** — `ModalOptions.cursor?: boolean`, Rectangle geom (font-agnostický, `█` U+2588 mimo Atkinson subset), tween yoyo alpha 1→0.2 @ 500 ms, named constants `CURSOR_ASPECT/V_INSET/GAP`, edge case guardy.
- **Mission Scenario v0.1** (`IDEAS.md`) — 7-aktový oblouk (Tranzit → Arrival → Refit → First Wake → First Society → Signál → Choices → Belt Closure), autorské beats (tónový arc samota→iterace, reveal discipline, T1 Earth „neosvobozená"), Q1-Q4 otevřené.
- **Narrative voice axiomy + E1-E8 sandbox** (`IDEAS.md`) — 6 axiomů (Event = lidská věta / suchý tech tón / čísla > adjektiva / koncovka jako pointa / scéna bez hudby / ASCII-safe + CZ display) + Before/After existujících event textů + 8 tón-first povídek napříč akty.
- **@AUDIT:CODE + @AUDIT:DOCS** (`audit/audit_260418_*.md`) — 7 dluhů z S32 vyřešeno; 5 nových (F1 FloatingPanel destroy listener cleanup deferred, F2 terminal magic strings → konstanty fixed, F4 stale `LOSS` komentář fixed). Docs: SPECIFICATION §4.5 Slab/Flux/Kredo retire, GLOSSARY II.1 food/air/water retire, PLAYTEST_GUIDE skeleton/covered + REPR retire + [Q] panel, POC_P1 refs napříč 14 soubory cleanup.
- **/simplify pass** — REAL BUG: tween leak v `ModalManager.close()` (Phaser nezabíjí tween při destroy targetu, infinite repeat akumuloval) → `killTweensOf(obj)` před destroy. + `HexStringToColor(UI_TEXT_PRIMARY).color` → `COL_AMBER_BRIGHT` direct. + named cursor constants. + edge case guardy. Vedlejší nález: `background.ts` má stejný tween leak pattern (zapsáno, neopraveno).
- **Art pipeline pivot** — opuštění 40×40 native + 16-color paleta. Pokus 1 (tile sheet 5×4 grid v jednom obraze) selhal: AI ignoruje footprinty, stíny na bg, uniform look, garbage text. **Pokus 2** = per-modul generation (`art/prompts/pokus2/{8 modulů}.md`), 1 prompt = 1 obraz = 1 modul, shared style boilerplate + unique silhouette. Habitat output (Gemini) krásný — odhalil **strukturální problém**: ISS-style moduly nesedí do compartment-style BELT layoutu. **Cesta C zvolena** = hull base + module overlay 75 % (hull = chassis, moduly = subsystems). **Pokus 3** (`art/prompts/pokus3/hull_tile.md`) — square 1024² tileable hull plating, painterly Chris Foss/Peter Elson, gunmetal restrained palette. Imagen 4 Ultra output dobrý (octagonal hatch + cable + grille focal — accept jako „bolted modular construction"). Zbývá 7 modulů (Engine/Dock/MedCore/Assembler/Solar/Storage/CommandPost), pak integrace `segment.ts` (hull base + module overlay + random `setRotation(90°×rand)`).
- 101/101 testů zelených, TS strict clean. Memory `feedback_single_process_machine.md` (zombie shell zabít bez ptaní).

Verze: **v4.0** (2026-04-17, konec sezení 32 — **@AUDIT:CODE + 7 dluhů + FloatingPanel base + QM Query terminal + M-110 DSO**). Hlavní změny:
- **@AUDIT:CODE** (`audit/audit_260417_code.md`) — 4 z 5 dluhů S28 vyřešeno (world.ts extrakce, InteractiveGameObject, ESC handler, UI_MASK_WHITE). Test coverage 9.5 % → 16.5 % (+74 %). Axiom skóre 13/13 ✅.
- **7 nových dluhů vyřešeno v jednom sezení** — F1 stale komentáře (14 míst v 5 souborech), F3 iconText dead field v InfoPanel, F4 `SEVERITY_COLOR` type narrowing (`Record<EventSeverity, string>`), F5 `SEED_DRONES` konstanta v tuning.ts, F6 `appendEventLog` slot retire (pipeline 12 → 11 slotů, events in-place), F2+F7 `FloatingPanel` base class.
- **`FloatingPanel` base class** (208 LOC, `ui/floating_panel.ts`) — extraktuje chrome + visibility + dock + scene listener lifecycle. `PanelSlot = "top-left"|"bottom-left"|"top-right"|"bottom-right"`, `computePosition()` derivovaná ze slotu. Abstract `buildBody()`+`renderBody()`. 4 panely migrovány: InfoPanel 384→272, ModulesPanel 414→326, EventLog 507→380, TaskQueue 318→203. **Celkem −442 LOC, net −234 LOC** po base class.
- **POC_P1.md smazán** (user volba B) — historický artefakt z S6/S7, popisoval single-player puzzle s WIN/LOSS (retired S20/S21 pivotem na Perpetual Observer). Unique info zachycena jinde.
- **Kurzor ruky globální fix** (Censure! — oprava) — `tooltip.ts` attach() nastavuje `scene.input.setDefaultCursor('pointer'|'default')` **dynamicky** v `pointerover`/`pointermove` podle `provider() !== null`. Izomorfismus: kurzor signalizuje dostupný infotip.
- **QM Communication Terminal** (IDEAS S31 varianta A) — nový `terminal.ts` (71 LOC), [Q]uery command v Bottom Baru, hotkey Q, auto-open při prvním spuštění (LS flag `voidspan.terminal.dismissed`), suchý tech tón QM persona. Modal reuse `ModalManager` (žádný vlastní scroll). **Welcome dialog retire** — `welcome.ts` (376 LOC) + `splash/welcome.png` + Help „Zobrazit uvítání" tlačítko smazáno. 1-col layout po user iteraci.
- **DSO swap M-42 → M-110** — iterace 1 plný M-31 Andromeda (7 SVG parts, halo/disk/core/dust_lane/satellity M32+M110) byl přeplněný. Iterace 2: KISS redukce na samotné M-110 (eliptická satelitka, protáhlá rotace -20°, gold-amber gradient). Folder `m31/` → `m110/`, `M31_*` → `M110_*` v background.ts, offset (80, 110) = pozice původního M-32.
- **LOC src/game: 6 549 → 6 092** (−457 LOC). Max soubor: `model.ts` 467 (katalog). 101/101 testů zelených, TS strict clean.

Verze: **v3.9** (2026-04-17, konec sezení 31 — **UX polish + EventVerb redukce + DSL/AI IDEAS + v0.8**). Hlavní změny:
- **EventVerb 25 → 9** — retire 16 verbů nepoužívaných v v0.7 (SPWN, ARRV, DPRT, REPR, BLD, DEMO, PROD, HAUL, FAIL, IDLE, WAKE, DOCK, TICK, EVNT, SAY, RPRT). Zachovány: SYST, DEAD, DECY, DMG, DRN, SIGN, ASSN, TASK, CMPL. Severity sets zredukovány, GLOSSARY Verb Catalog přepsán (9 aktivních + 16 retirovaných s návratovým triggerem R2/P2+).
- **InfoPanel** — 3. řádek Drony (working/idle/offline) + hierarchický formát (kapitola + odsazená podkapitola, izomorfismus s kvintet tooltipy). COL_OFFSET → 0, iconText prázdný.
- **ModulesPanel** — 3 řádky agregátů retirovány. 5-sloupcová tabulka: `Kind (id) status HP% task_state`. `moduleStatusCs()` (OK/poškozeno/zničeno/offline/staví/demoluje) + `moduleTaskState()` (plán/oprava.../nelze). Zebra cyklus added→zjemněno→pryč. **5-color semafor per řádek** (setColor na RATING_COLOR). `statusIcon()` retire (dědictví S27 lampičky). Fix „poškozeno 100%" floating-point artefaktu (porovnání s hpPct int, ne raw hp).
- **S/F tooltip** — partial-day fallback. Nový `currentDayRate()` helper v world/flow.ts — když `flow.filled === 0`, extrapolovat partial bucket × (DAY/elapsed). User vidí drain během prvních 4 min wall, ne až po rotaci window.
- **EventLog chip sync** — `syncSeenVerbs()` helper volaný v constructor + toggle(). Eliminuje 1-frame delay mezi SYST eventem a SYST chipem.
- **v0.7 → v0.8 bump** — package.json (root + client), PLAYTEST_GUIDE.md.
- **IDEAS** — 2 nové sekce: **Protocol DSL (S31+)** s paradigma tabulkou (A–E) + reference-text test suite (user slovní plán → DSL v0) + upgrade path mapping + Q1–Q15. **QM Communication Terminal (S31+)** — vize AI terminalu + 8 červených vlajek oponentury + hybridní varianty A/B/C/D + path forward (A→B→C→D) + Q1–Q8.
- 101/101 testů zelených (beze změny; nové features testovány přes live dev server).)

Verze: **v3.8** (2026-04-17, konec sezení 30 — **iterace po S29**). Hlavní změny:
- **Lazy filter chips v EventLog** — `verbFilters` LS persist, wrap 2 řádky abecedně, click toggle, default all ON; chip font 9 px, underline pryč.
- **Bottom Bar** `[I]info` → `[I]nfo` napříč 5 položkami (úspora 5 znaků).
- **Ellipsize v row panelech** — `ellipsizeText` binary search helper. ModulesPanel single blob → per-row pair (kindIdText ellipsize + statsText fix column). TaskQueue lead + suffix dynamic right-aligned.
- **Tooltip na ořezaných řádcích** — provider vrací plnou verzi jen když byl ořez; 3 panely mají attachTooltips.
- **Asteroid system + pomalý decay** — `DECAY_RATE_PER_GAME_DAY` 150× pomalejší (0.0000667), `scheduledEvents` slot 9 aktivní: 1× / 10h wall hit na random non-void bay, 5-20 % hp_max damage, 600ms red flash overlay (`Module.flashUntilTick`).
- **M-42 Orion Nebula** — random DSO retirován, 7 SVG parts (3 wisps smazány) fixed world pos `(220, 180)`, scale 0.55, BlendMode.ADD/NORMAL, `preloadM42()`.
- **Pevné 2×2 layout panelů** — mutex I↔M + E↔T zrušen, `PANEL_HALF_H = 367` (+30 %), `PANEL_WIDTH_STD = 460`, 4 panely otevřené současně.
- **Cryo failure (slot 6 actorLifeTick)** — všechny MedCore HP=0 → 32× DEAD, jeden aggregate event.
- **Help modal 2-col** — `ModalOptions.bodyLeft/bodyRight`, PANEL_W 520→720 při 2-col.
- **Footers odstraněny** z EventLog (count + 📋) a TaskQueue (count).
- **BOOT → SYST** (Censure! po SYS 3-char pokus; memory `feedback_convention_audit.md`).
- **cost_coin retirován** — zavádějící (FVP neutrácí); katalog `recipe` převeden na **TOTAL** hodnoty místo per-HP rate (getTaskRecipe dělí hp_max za běhu).
- 101/101 testů zelených (88 → 101 tests).)

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

**S38 dokončeno (2026-04-19, v1.1):** Milestone bar + QM Terminal DRY refactor + paused reason text + unified scale fix + kvintet rounding + dead code cleanup + particles prototyp→IDEAS + audity CODE/DOCS + 20 nových testů.

**Příští sezení (S39+) — v1.1 pokračování (priorita dle IDEAS Roadmap):**
- **Osa 2 — Persistent server** (v1.1+, největší scope) — headless Node.js sim + plain WS + JSON broadcasts. Architektura: `apps/server/` monorepo + shared `packages/shared/` pro model. Protokol: HELLO (full snapshot) + SNAPSHOT (delta) + EVENT stream. Persistence: flat JSON dump (POC) → SQLite (query history). Deploy: VPS Basic + systemd + Caddy. Scope ~10-15 sezení. Colyseus jako upgrade path pro P2+ multi-belt.
- **Osa 3 — i18n AJ/ČJ** (v1.1+) — `t(key, params?)` helper + `strings.cs.ts` + `strings.en.ts` + language switcher. Challenge: CZ gender agreement (TASK_NOUN_CS gender tagging) + pluralization (1/2-4/5+). ~3-5 sezení. Závislost: stabilizace UI (po server).
- **Wake-up mechanismus (R2 start)** — odloženo na později (před nebo po server). První kolonista se probouzí (welcome CTA „Probudit" nebo auto trigger). Cryo → idle → working lifecycle. Trigger milestonu #6.
- **Module research & upgrade paths (IDEAS S36)** — Solar 1×1 → 2×2 (10× produkce). Q1-Q5 decision (rebuild vs. in-place / cost / prereq / reverz / visual). P2+ scope.

**Další bagr (R2 Player Awakening):**
- Player HP ekonomika, Commands palette `[B]uild [R]epair [D]emolish`, Scripted capsule drops, Energy=0 cryo failure trigger, Observer/Player mode switch, Research ladder.

**S37 hotovo (v1.0 Observer Edition release + Time speed + Event redesign + Collapse epitaph):**
- v0.9 → v1.0 Observer Edition release label napříč (package.json ×2, PLAYTEST_GUIDE, terminal.ts první řádek).
- Time speed control — TimeSpeed `1 | 10 | 100 | 1000`, SpeedPopover v Top Baru pod herním časem, suffix ×N jen když >1. ESC chain rozšířen. Help text dokumentuje.
- Event system redesign „verb = ikona, text = subjekt" — eventIcon csq-aware (TASK:START/RESUME → `>`, PAUSE → `||`), texty zkráceny napříč 4 eventovými soubory, TASK_VERB_CS → TASK_NOUN_CS.
- taskLoc helper + [Kdy, Kde] konzistence napříč ASSN/CMPL/TASK eventy.
- Collapse epitaph (world/collapse.ts slot 6b) — detekce all actors dead → one-shot SYST:CRIT „Kolonie ztracena". Dává pointu narrative arc bez porušení Observer axiomu.
- 3 EventLog bugy: wheel scroll četl deltaZ místo deltaY (nikdy nefungovalo), bg-level listener fragile nad scrollbarem, ring buffer dirty gate selhával při saturaci (první DMG chip se neobjevil). Fix: scene-level wheel + seenVerbs re-populate every frame.
- TaskQueue `active`: orange → cyan (mimo rating paletu, zabrání vizuální kolize s HP rate-2 warning).
- FloatingPanel.isPointerInBounds extract — 3 konzumenty (EventLog, InfoPanel, ModulesPanel).
- Audity CODE/DOCS — progressBar/renderBar konsolidace, art/README.md Neon rewrite, PLAYTEST_GUIDE +[H]elp+Rychlost, SPECIFICATION header 2026-04-19.
- 103/103 testů zelených, TS strict clean.

**S36 hotovo (SegmentPanel retire + extract + cestovní layout + Solar upgrade axiom):**
- **SegmentPanel definitivně retire** — `segment.ts` (298 LOC) + `USE_PROCEDURAL_RENDER` flag + GameScene dispatch + 8× PNG v `public/assets/modules/` smazáno. `ShipRender` je jediný renderer, žádný fallback. art/modules/ zdroje ponechány (production archiv).
- **Dead data cleanup** — `asset: string` pole z `ModuleDef`/`ActorDef` + 9 hodnot + 2 test asserts + `BAY_NATIVE`/`BAY_SCALE` z layout.ts (dead po segment.ts retire).
- **`findActiveTaskForModule` + `isConstructionTask` extract** do `world/task.ts`, re-exportované z `world/index.ts`. Konzumenty: `ship_render.ts` preflight + `repairStateText`, `modules_panel.ts` `moduleTaskState`. Rule-of-two deferred z S35 simplify passu.
- **Stavebnice 2 iterace:** první (MINDMAP návrh CP 2×2 + SolarArray 2×1 × 2 + full coverage) user zavrhl. **Finální cestovní minimalist** — FVP je tranzit konfigurace (32 v cryo, 400 let cesty), prostorová redundance víc než hustota. Engine 2×2 fix, 8× 1×1 modul (2×Solar + 2×Storage nahoře, Habitat/Med/Asm/CP dole), 4 void na čele (cols 0-1) = expansion space pro upgrady po příjezdu.
- **Deterministický layout** — `shuffleInPlace` + `BODY_IDXS` drop z `createInitialWorld`, hardcoded `START_MODULES` tuple s rootIdx. User learns anatomy.
- **Tabler ikony beze změny** — user explicit „stejná velikost, vždy centrované". Žádné scaling per module size.
- **Solar upgrade axiom** — IDEAS sekce „Module research & upgrade paths (S36)" za QuarterMaster upgrade path. Solar 1×1 → 2×2 s **10× produkcí** (24 → 240 W) po výzkumu. + Storage/Habitat/MedCore expanze kandidáti. Q1-Q5 otevřené. Kód beze změny (FVP drží 24 W).
- 100/100 testů zelených (S35 mělo 101, 1 test smazán s `asset` asserty — správně), TS strict clean, `pnpm build` clean. Net LOC delta −~460.

**S35 hotovo (Neon paleta + ShipRender + Tabler ikony + semafor barva modulů):**
- **Paleta přepsána na Neon** v `palette.ts` — 5 rating tónů výbojkové rodiny, cyan retired z rating (zachován pro Storage/Fluids kanon), AMBER saturovanější, VOID_BLACK hlubší. Canvas BG `#000000`.
- **Nová §1b KIND_\* konstanty** (8 per-modul identity hue) pro budoucí decorative use case. Z palette-preview §2.
- **`ratingColorNum(pct)` + `RATING_COL`** — number paralela existujícího HEX mappingu pro Phaser fillStyle/setTint.
- **`palette-preview.html`** nová reference stránka. Původní `style-guide.html` zachován jako archiv.
- **ShipRender** (`apps/client/src/game/ui/ship_render.ts`, 433 LOC) — procedural BELT renderer (Phaser.Graphics outline + fill + Tabler SVG glyph + asteroid flash + selection). Sdílí public API se SegmentPanelem, dispatch přes `USE_PROCEDURAL_RENDER` flag.
- **9 Tabler SVG ikon** (MIT) preloaded jako Phaser.Image, tint = `ratingColorNum(hpPct)` (semafor izomorfismus s ModulesPanelem). Mapping Habitat=home, Solar=solar-panel, Storage=package, Assembler=hammer, Dock=anchor, Engine=engine, MedCore=first-aid-kit, Command=broadcast, fallback=cube.
- **Status modulace:** online solid, damaged dashed outline + HP fill zleva, offline grey + checker, building dotted + progress fill. Void = dashed grey + „+" procedural.
- **Active task pulse** — outline alpha yoyo sin 0.5..1, perioda 2 s, fill static (skutečné HP%). Směr (ascending/descending) se vizuálně neliší, detail v tooltip.
- **/simplify pass** — activeTaskModuleIds Set preflight (O(tasks) scan 1×/frame), pulse phase hoist, drawDashedLine closure → private method, Math.hypot → axis-aligned abs sum, flag komentář konsistence.
- 101/101 testů zelených, TS strict clean.

**S34 hotovo (Art pipeline cesta C rollback + AI arena brief + Gemini mix):**
- **Cesta C integrační test selhal** — hires pipeline `scripts/build-assets-hires.py` (Python Pillow chroma-key bez downscale) + segment.ts refactor (16 hull sprites, uniform contain scale, deterministická rotace, feature flag `USE_HULL_OVERLAY`). User vizuální test: „Tohle nefunguje, rollback."
- **Rollback přes `git checkout`** — staré 40×40 pixel art zpět. Code untouched.
- **Pivot na AI arena** — `art/arena_brief.md` self-contained prompt pro arena.ai, 3 zóny (header/ship/bottom), modulární stavebnice, anti-vzory (NASA/Chris Foss/generic sci-fi), styl jen doporučení.
- **Arena 2 Gemini iterace** — v1 hologram dashboard + v2 blueprint klid. User verdict: **mix v1 + v2** (v2 base + v1 action efekty). Uloženo `art/arena_winners/gemini_1.png` + `gemini_2.png`.
- **IDEAS 2 nové sekce** — Art pipeline pivot (diagnóza, retire list) + Style extraction (paleta per modul kind, status izomorfismus, implementation outline pro S35). LOC cíl ≤500, žádné PNG.
- **Úklid** — retire `pokus1.md`, `pokus2/` (8 souborů), `pokus3/`, `build-assets-hires.py`, package.json alias. Settings konsolidace (+ `python:*`).
- **Technická lekce** — `pnpm build:assets` je 40×40 pixel art pipeline (downscale 36×36), mix s hires nemožný bez bypass.
- 101/101 testů zelených, TS strict clean.

**S33 hotovo (v0.9 + dvojitý audit + Mission Scenario + Narrative voice + Art pipeline pivot):**
- **v0.8 → v0.9 bump** — package.json root + client, PLAYTEST_GUIDE.
- **QM Terminal `buildTerminalBody(w)`** — runtime placeholders {E/W/S/F} + `[Nestabilní!!!]` ASCII tag + SEED_CREW_CRYO/SEGMENT_ADDRESS konstanty.
- **Modal SIDEPANEL font (18 px)** — sjednoceno s I/M/E/T panely. Help + Terminal hustší.
- **Blikající kurzor v modalu** — `cursor?: boolean` option, Rectangle geom, tween yoyo 500 ms, named constants, edge case guardy.
- **Mission Scenario v0.1** v `IDEAS.md` — 7-aktový oblouk od Tranzit po Belt Closure, autorské beats.
- **Narrative voice axiomy + E1-E8 sandbox** v `IDEAS.md` — 6 axiomů hlasu + Before/After existujících event textů + 8 tón-first povídek.
- **@AUDIT:CODE + @AUDIT:DOCS** — `audit/audit_260418_*.md`. Vyřešeno: SPECIFICATION §4.5 Slab/Flux/Kredo retire, GLOSSARY II.1 food/air/water retire, PLAYTEST_GUIDE skeleton/REPR retire + [Q] panel, POC_P1 refs napříč 14 soubory cleanup, palette stale „LOSS" komentář, terminal magic strings.
- **/simplify pass** — REAL BUG: tween leak v `ModalManager.close()` fix (`killTweensOf` před destroy). + `COL_AMBER_BRIGHT` direct místo HexStringToColor + named cursor constants + edge case guardy.
- **Art pipeline pivot** — opuštění 40×40 + 16-color: pokus 1 (tile sheet) selhal → pokus 2 (per-modul, 8 prompts) → odhalil layout problém (ISS-style vs. compartment-style) → cesta C zvolena (hull base + module overlay 75 %) → pokus 3 hull tile generated. Habitat + hull tile assety hotové, 7 modulů + integrace zítra (S34).
- 101/101 testů zelených, TS strict clean. Memory `feedback_single_process_machine.md`.

**S32 hotovo (@AUDIT:CODE + 7 dluhů + FloatingPanel + QM Query terminal + M-110 DSO):**
- **@AUDIT:CODE** `audit/audit_260417_code.md` — scorecard vs. S28, 13/13 axiomů, test coverage 16.5 %.
- **7 dluhů vyřešeno** — F1 stale komentáře, F3 iconText, F4 `Record<EventSeverity>`, F5 `SEED_DRONES`, F6 `appendEventLog` retire, F2+F7 base class.
- **`FloatingPanel` base class** — 4 panely migrovány, −442 LOC, net −234. EventLog max klesl z #1 (507) na #3 (380).
- **POC_P1.md smazán** — historický artefakt, retire.
- **Kurzor ruky globální** — `tooltip.updateCursor(hasTooltip)` dynamicky per `provider()` result.
- **QM Terminal** — [Q]uery command, auto-open, LS flag, suchý tech tón. Welcome retire.
- **M-110 DSO** — KISS redukce z M-31 kompozice na samotnou eliptickou satelitku.
- 101/101 testů, TS strict, dev server HMR.

**S31 hotovo (UX polish + EventVerb redukce + DSL/AI Terminal IDEAS + v0.8):**
- **EventVerb 25 → 9** — retire nepoužívaných (SPWN, ARRV, DPRT, REPR, BLD, DEMO, PROD, HAUL, FAIL, IDLE, WAKE, DOCK, TICK, EVNT, SAY, RPRT). Data-driven pravda: co v typu = co lze vidět. GLOSSARY katalog přepsán (9 aktivních + 16 retirovaných s návratovým triggerem R2/P2+).
- **InfoPanel** — 3. řádek Drony (working/idle/offline izomorfní s Posádka cryo/alive/dead). Hierarchický formát kapitola + odsazená podkapitola (izomorfismus s E/W/S/F tooltipy).
- **ModulesPanel** — 5-sloupcová tabulka: `Kind (id) status HP% task_state`. Rating header zachován, 3 řádky agregátů retire. Zebra stripes added → zjemněno → úplně pryč. **5-color semafor per řádek** (RATING_COLOR dle hpPct, izomorfismus „ukazatel a barva sdílí metriku"). `moduleStatusCs` porovnává displayed int (fix „poškozeno 100%" floating-point artefaktu).
- **S/F tooltip** — `currentDayRate()` fallback: partial bucket × (DAY/elapsed) = extrapolovaný rate, když `flow.filled === 0`. User vidí drain okamžitě, ne po 4 min wall.
- **EventLog chip sync** — `syncSeenVerbs()` v constructor + toggle() před renderRows. SYST chip vzniká ve stejné milisekundě jako SYST řádek, bez 1-frame delay.
- **v0.7 → v0.8** (package.json root+client, PLAYTEST_GUIDE.md).
- **IDEAS** — Protocol DSL + QM Communication Terminal sekce zapsány. Oponentura k AI terminalu: T2 violation, LLM fatigue, persona drift, prompt injection, multiplayer misconception, overthinking. Hybrid path A (template)→B (AI overlay, propose)→C (AI writer)→D (full AI).
- 101/101 testů (beze změny), TS strict čistý.

**S30 hotovo (lazy filters + 2×2 layout + asteroid + M-42 + cryo failure + recipe totals):**
- **Lazy filter chips** v EventLogu — per-verb on/off (abecední wrap, LS persist, default all ON, chip font 9 px bez underline). „Další bagr" #10 ✅
- **Bottom Bar** `[I]info` → `[I]nfo` (úspora 5 znaků, 5 tlačítek).
- **Ellipsize v row panelech** — `ellipsizeText` helper (binary search, `…` single char). ModulesPanel single blob → per-row pair (kindIdText fix column 220 + statsText). TaskQueue lead + suffix **dynamic right-aligned** (suffix.x = PANEL_W − PADDING − suffix.width). Middle-column ellipsis jen názvu, ne statusbaru.
- **Tooltip na ořezaných řádcích** — `fullRowData[]` paralelní, `attachTooltips()` v E, T, M; tooltip provider vrací null pokud nebyl ořez.
- **Asteroid system (návrat S28 retire)** — `scheduledEvents` slot 9 aktivní. 1× / 10 h wall, 5–20 % hp_max, red flash 600 ms. `Module.flashUntilTick` + segment overlay. Plošný decay 150× pomalejší (0.0000667). Žádné kapsle (user rozhodnutí).
- **M-42 Orion Nebula** — 7 SVG parts (3 wisps retired po user feedbacku) v `public/assets/dso/m42/`, fixed world pos `(220, 180)`, scale 0.55, BlendModes.ADD/NORMAL. Random DSO retirován.
- **Pevné 2×2 layout** — mutex I↔M + E↔T zrušen, `PANEL_HALF_H = 367` (+30 %), `PANEL_WIDTH_STD = 460`. I vlevo nahoře, M vlevo dole, E vpravo nahoře, T vpravo dole.
- **Cryo failure (slot 6 actorLifeTick)** — všechny MedCore HP=0 → 32× DEAD s hromadným event. Endgame spirála: S/F dojdou → QM stop → asteroid zničí MedCore → 32 mrtvol. „Kus šrotu bez života, doslova."
- **Help modal 2-col** — `ModalOptions.bodyLeft/bodyRight`, PANEL_W 520 → 720.
- **Footers retire** — EventLog (count + 📋 Copy button) + TaskQueue (count).
- **BOOT → SYST** (po Censure! k 3-char SYS). Memory `feedback_convention_audit.md`.
- **cost_coin retire** (zavádějící ve FVP); **recipe** v katalogu přepsán na **TOTAL** hodnoty (Engine 211 S + 62 F atd.), `getTaskRecipe` runtime převod na per-HP.
- 101/101 testů zelených.

**S29 hotovo (font swap + čitelnost + Welcome reset):**
- **Font VT323 → Atkinson Hyperlegible** — sans navržený Braille Institutem pro max čitelnost. Fallback kandidát `IBM Plex Mono`, kdyby proporcionální font rozbil tabulkové layouty. Preload 7 velikostí (16/18/20/22/28/36/48 px) v `main.ts` před `new Phaser.Game`.
- **Globální bump -2 px** — sans má větší x-height, menší velikost zůstává čitelná. Hierarchie CHROME 22 / PANEL 20 / TIP 18.
- **Nová `FONT_SIZE_SIDEPANEL = 18px`** — I/M/E/T panely mají extra -2 px oproti modalu/welcome/ActorsPanel/commandButton (PANEL=20). Vyšší hustota dat v bočních panelech opravňuje menší velikost.
- **Welcome reset cesta** — Help [H] → tlačítko „Zobrazit uvítání" (vlevo od Close). Modal API rozšířeno o `action?: { label, onClick }`. `resetWelcome()` mazač LS flagu. Přínosné pro playtestery P1–P4.
- **DSO 1/8** — `DSO_CHANCE` 0.35 → 0.044. Mlhoviny jsou teď vzácné výjevy, ne 1/3 chunks.
- **Font preview tooling** — `public/font-preview.html` s 7 kandidáty × 3 velikosti × CS pangram + čísla/diakritika/UI sample. Opakovaně použitelné pro příští font rozhodnutí.
- **Stroj swap hejna → mrkla** — discard lokálního WIP palette.ts, pull 5 commitů (S25-S28). CLAUDE.md `@BEGIN` rozšířen o krok 2 (MEMORY.md) + krok 7 (pnpm dev na pozadí).

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
10. ~~**Lazy filter chips**~~ ✅ S30 — per-verb abecední wrap, LS persist, default all ON.
11. **Module FX animations** — blink/fan/dish/sparks. Data-driven (`ModuleDef.fx?`) nebo shader pipeline.
12. ~~**Font glyph fallback fix**~~ ✅ S27 — KISS ASCII substituce napříč rendered code (events.ts VERB_CATALOG, header.ts tooltipy, modules statusIcon, close buttons, OBSERVER_ID, help modal, SIGN texty). Latin-1/latin subset bezpečné chars zachovány. P2+ alternativa (pokud bude vůle): self-host VT323 TTF s `unicode-range: U+0000-FFFF` v `@font-face` — vrátí všechny původní glyphy.

**Terminologie prototypů:** P1/P2/P3/P4 = **POC** (proof of concept), ne MVP. Cíl = dialog s blízkými, ne trh.

**Terminologie entit:** WORLD → BELT → SEGMENT → MODULE → BAY. Pojem „Cell" retirován. SHIP-Bow/Stern retirován (S6).
