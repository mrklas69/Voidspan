# TODO.md — Voidspan

Konkrétní úkoly. Hotové položky přesouvej do `DONE.md`.

## Otevřené otázky designu

- [ ] **Q7:** Rozhodnout identitu hráče (avatar / loď / korporace / hybrid).
- [ ] **Q8:** Mechanismus unlocku větve — cena, proces, kdo rozhoduje, jak hlasování.
- [ ] **Q9:** Atomická akce v real-time — click / cooldown / denní energie / hybrid.
- [ ] **Q10:** Úroveň programování NPC-správce (presety vs. bloky vs. skript).
- [ ] **Q11:** Vítězná podmínka v perzistentním světě (legacy body, žebříček, sezóny).
- [ ] **Q17:** Rozsah prvního prototypu — doporučeno P1 (monopoly mýto sim), bez entropie / forků / NPC.

## Pilot projekty k ověření

- [ ] **P1 — Monopoly mýto sim:** minimální prototyp, 10 políček, 3 hráči, mýto + Ponzi bublina. Otestovat: generuje napětí? škrtí newbies?
- [ ] **P2 — Entropie & trhání pásu:** simulace chátrání a rozpadu větve. Otestovat: je decay tempo zábavné? jak často hráči přicházejí o claim?
- [ ] **P3 — Fork-jako-event:** UX flow pro kolektivní odblokování větve. Otestovat: je cena vnímána férově? motivuje to koordinaci?

## Infrastruktura (po rozhodnutí Q17)

- [ ] Objednat Forpsi VPS Linux Basic (až bude prototyp lokálně funkční).
- [ ] Přesměrovat DNS `bete1geuse.com` na VPS IP (A záznam).
- [ ] Zvážit zrušení Easy hostingu po přechodu na VPS.
- [ ] Založit monorepo (pnpm workspace: `apps/server`, `apps/client`, `packages/shared`).
- [ ] Nastavit TypeScript + Colyseus server skeleton.
- [ ] Nastavit Phaser 3 klient skeleton (pixelArt: true, setRoundPixels: true).
- [ ] Složka `art/` pro 8-bit grafické návrhy.

## Stack — rozhodnuto

- Runtime: **Node.js 22 + TypeScript**
- Multiplayer: **Colyseus**
- DB (prototyp): **SQLite**, produkce **PostgreSQL 16**
- ORM: **Drizzle** nebo **Prisma** (zatím neurčeno)
- Frontend: **Phaser 3** + TypeScript
- Reverse proxy / SSL: **Caddy** (auto HTTPS)
- Deploy: **systemd service** + git pull na VPS
- Monorepo: **pnpm workspace**
