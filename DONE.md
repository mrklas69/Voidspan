# DONE.md — Voidspan

Hotové úkoly. Přesouvá se z `TODO.md`.

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
