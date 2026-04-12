# DONE.md — Voidspan

Hotové úkoly. Přesouvá se z `TODO.md`.

## 2026-04-12 (Sezení 2 — Hosting & Stack)

- [x] **Q6:** Zjistit typ hostingu na Betelgeuse.com. **Zjištěno:** Forpsi Easy Windows (sdílený IIS 10, PHP + .NET Core, MSSQL 2019 + MySQL 8, App Pool 256 MB / 25 % CPU, Timer pro plánované úlohy). Pro real-time perzistent world **nestačí**.
- [x] **Rozhodnutí A2 — Real-time VPS.** Volba: **Forpsi VPS Linux Basic** (160 Kč/měsíc, 2 vCPU, 4 GB RAM, 40 GB NVMe, root).
- [x] **Q12:** Backend runtime → **Node.js 22 + TypeScript**.
- [x] **Q13:** Databáze → **SQLite pro prototyp**, Postgres později.
- [x] **Q14:** Frontend engine → **Phaser 3** (Voidspan = živý animovaný svět, ne statická mapa).
- [x] **Q15:** Síťový protokol → **Colyseus** (authoritative server, auto state sync).
