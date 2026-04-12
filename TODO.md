# TODO.md — Voidspan

Konkrétní úkoly. Hotové položky přesouvej do `DONE.md`.

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

- [ ] **Act I–V backbone** — konkretizovat thresholdy a trvání.
- [ ] **Scripted events bank** — naplnit prvními 10 událostmi (struktura v SCENARIO.md sekce 4).
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
