# TODO.md — Voidspan

Konkrétní úkoly. Hotové položky přesouvej do `DONE.md`.

## Otevřené otázky designu (přednost)

- [ ] **Q6:** Zjistit typ hostingu na Betelgeuse.com (sdílený / VPS / admin práva, WebSocket, persistentní procesy).
- [ ] **Q7:** Rozhodnout identitu hráče (avatar / loď / korporace / hybrid).
- [ ] **Q8:** Mechanismus unlocku větve — cena, proces, kdo rozhoduje, jak hlasování.
- [ ] **Q9:** Atomická akce v real-time — click / cooldown / denní energie / hybrid.
- [ ] **Q10:** Úroveň programování NPC-správce (presety vs. bloky vs. skript).
- [ ] **Q11:** Vítězná podmínka v perzistentním světě (legacy body, žebříček, sezóny).

## Pilot projekty k ověření (A1 z 1. sezení)

- [ ] **P1 — Monopoly mýto sim:** minimální prototyp, 10 políček, 3 hráči, mýto + Ponzi bublina. Otestovat: generuje napětí? škrtí newbies?
- [ ] **P2 — Entropie & trhání pásu:** simulace chátrání a rozpadu větve. Otestovat: je decay tempo zábavné? jak často hráči přicházejí o claim?
- [ ] **P3 — Fork-jako-event:** UX flow pro kolektivní odblokování větve. Otestovat: je cena vnímána férově? motivuje to koordinaci?

## Infrastruktura

- [ ] Založit `art/` složku pro grafické návrhy (8-bit retro).
- [ ] Rozhodnout grafický engine (Phaser / PixiJS / kaplay) — až po Q6.
- [ ] Rozhodnout server tech (Node / .NET / Go) — až po Q6.
- [ ] Rozhodnout databázi — až po Q6.
