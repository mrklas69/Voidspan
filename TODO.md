# TODO.md — Voidspan

Konkrétní úkoly. Hotové položky přesouvej do `DONE.md`.

## Revize S4 — k zapracování do dokumentů

- [ ] **R1 Multi-colony:** přepsat `GLOSSARY.md` (Belt → síť beltů), `SCENARIO.md` §4.4 (frakce mezikolonijní), aktualizovat World Browser v IDEAS (active competition view).
- [ ] **R2 Penal colony + amnesty:** nová sekce v `SCENARIO.md`, napojit na Endings spectrum a Act III krize.
- [ ] **R3 Alts policy:** dopsat do `SCENARIO.md` sekce 11 (onboarding) jako feature, ne restrikci.
- [ ] **Terminologie:** nahradit „prototyp/pilot" → **POC** (proof of concept) v TODO a dalších dokumentech konzistentně.
- [ ] **Q-World-1:** fyzický vztah mezi belty po R1 (jedna hvězda / soustava / galaxie, vzdálenosti, cestování, komunikace).
- [ ] **Q-Player-Origin:** proč hráč uniká ze Země — provinění/trest vs. elita/mise vs. jiné. Mlhavost zachovat jako feature, ale rozpracovat varianty.
- [ ] **Q-Comm-Privacy:** rozsah neprotokolované komunikace mezi hráči (kanál, limity zprávy, anti-abuse, moderace). Viz Faction Hierarchy v IDEAS.
- [x] **Q-Player-Schema (S4):** POC = STATUS + RANK + SKILL. PERK Phase 2+. STATUS = aktuální role (kontextuální), RANK = pozice v hierarchii (občanství + role), SKILL = praxí rostoucí dovednost.
- [x] **Q9 Tempo (S4):** time-gated akce, duration minuty–hodiny, brains drží prioritu mezi loginy. Žádná denní energie v POC. Default rytmus hráče: ~1× denně, 10–20 min session.
- [ ] **Q-Brains-Schema:** UX brains — kolik sliderů, jaká granularita, jaké kategorie, jak vizualizovat v UI. 3–5 os pro POC.
- [ ] **Q-Institutional-Mail:** formát komunikace hráč↔instituce (správní rada, banka, parlament, šerif). Šablony? Free text? Response timeline? Viditelnost?
- [ ] **Q-Session-Rhythm:** pobídky k návratu — push/email notifikace? Nebo jen přirozená zvědavost? Anti-exploit pokud hráč loguje 10×/den.
- [ ] **Q-Delegate-Scope (Phase 2+):** nad brains režimy API/AI. Odloženo, viz IDEAS.

## Otevřené otázky designu (po pivotu na prstenec, V6)

- [ ] **Q7:** Rozhodnout identitu hráče (avatar / loď / korporace / hybrid).
- [ ] **Q9:** Atomická akce v real-time — click / cooldown / denní energie / hybrid.
- [ ] **Q10:** Úroveň programování NPC-správce (presety vs. bloky vs. skript).
- [ ] **Q11:** Vítězná podmínka / smysl hry (legacy body, žebříček, sezóny, milestones).
- [ ] **Q12:** Jméno hvězdy (cosmology V6).
- [ ] **Q13:** `CONST_BELT_LENGTH` pro prototyp (doporučeno 500–2000).
- [ ] **Q14:** Cena a mechanismus *Orbital Shift* (kolik Kredo, jaké hlasování, jak dlouho trvá).
- [ ] **Q15:** Století Earth reference (může zůstat otevřené, viz T1 prequel tenet).
- [ ] **Q17:** Rozsah prvního prototypu — doporučeno P1 (monopoly mýto sim), bez entropie / orbital shiftu / NPC.

## Pilot projekty k ověření

- [ ] **P1 — Monopoly mýto sim:** minimální prototyp, ~10 cells, 3 hráči, mýto + spekulativní bublina. Otestovat: generuje napětí? škrtí newbies?
- [ ] **P2 — Entropie & decay:** simulace chátrání cells. Otestovat: je tempo zábavné? jak často hráči přicházejí o claim?
- [ ] **P3 — Belt closure UX:** jak vypadá finální spojení posledního cell s hubem. Otestovat: je ceremonie uspokojivá?
- [ ] **P4 — Orbital Shift UX:** flow hlasování + dopad na globální parametry. Otestovat: je rozhodnutí srozumitelné? motivuje koordinaci?

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

## HelloWorld pilot (G2)

- [ ] Lokální skeleton: pnpm monorepo, Colyseus server, Phaser klient, ping-pong přes WS.
- [ ] Push na GitHub `mrklas69/Voidspan`.
- [ ] Deploy na Render (free tier, sleep acceptable).
- [ ] Ověřit: WS spojení, cold start, URL sdílitelná.

## Infrastruktura (po rozhodnutí Q17)

- [ ] Objednat Forpsi VPS Linux Basic (až bude prototyp lokálně + na Renderu funkční).
- [ ] Přesměrovat DNS `bete1geuse.com` na VPS IP (A záznam).
- [ ] Zvážit zrušení Easy hostingu po přechodu na VPS.
- [ ] Nastavit systemd service + git pull deploy.
- [ ] Caddy reverse proxy + auto HTTPS.
- [ ] Založit složku `art/` pro 8-bit grafické návrhy.

## Stack — rozhodnuto

- Runtime: **Node.js 22 + TypeScript**
- Multiplayer: **Colyseus**
- DB (prototyp): **SQLite**, produkce **PostgreSQL 16**
- ORM: **Drizzle** nebo **Prisma** (zatím neurčeno)
- Frontend: **Phaser 3** + TypeScript
- Reverse proxy / SSL: **Caddy** (auto HTTPS)
- Deploy (prototyp): **Render free tier** → (produkce) **VPS + systemd**
- Monorepo: **pnpm workspace**

## Deprecated (přesunuto do IDEAS parkoviště)

- ~~Q8 (mechanismus forku)~~ — zrušeno s forky.
- ~~Větvení, fork limit, Rift jako zdroj~~ — viz IDEAS „Parkoviště".
