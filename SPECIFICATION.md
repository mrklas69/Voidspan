# SPECIFICATION.md — ⊙ Voidspan

**Souhrnná zadávací dokumentace projektu Voidspan.**

Cílem tohoto dokumentu je poskytnout **úplný a sebe-nosný zdroj** pro programování, nasazení a rozvoj aplikace. Kompletní validovaný dokument **ukončí přípravnou fázi** projektu.

**Verze:** v0.2 (2026-04-13, snapshot po sezení 14) — **nekompletní, viz sekci 10 a 11**.
**Status:** <span style="color:red">**PREPARATION PHASE — PARTIAL IMPLEMENTATION (FVP Observer Edition v0.9)**</span>

**Poznámka k aktuálnosti (2026-04-18):** Dokument nebyl aktualizován od S14. Od té doby proběhl pivot z P1 single-player puzzle na **Perpetual Observer Simulation** (S20), retire Slab/Flux/Kredo → Solids/Fluids/Coin (S25), retire food/air/water subtypů (S25 KISS), retire `POC_P1.md` (S32). Pro **aktuální** stav kánonu viz `MINDMAP.md` (v4.0), `GLOSSARY.md` (v1.4) a `IDEAS.md`. Tato SPECIFICATION se dostane do v0.3 po konsolidaci FVP.

**Changelog v0.1 → v0.2:** Uzavřeno 12 otázek napříč S5–S13 (Q-World-1, Q-P1-*, Q11, Q12, Q13, Q-Player-Schema). E1 (SCENARIO paralelní struktura) vyřešeno v S14. W3 (Resource Model v GLOSSARY/SCENARIO) vyřešeno v S13 sweep. §4.5 Zdroje aktualizováno na Resource Model v0.1 (E/W/S/F/◎).

---

## 0. Jak číst tento dokument

- Sekce 1–9 = **zadání** (co, pro koho, jak).
- Sekce 10 = **otevřené otázky, mezery, varování, chyby** — zvýrazněno <span style="color:red">červeně</span>.
- Sekce 11 = **kritéria ukončení přípravné fáze** (acceptance checklist).
- Odkazy na podrobnosti: `GLOSSARY.md`, `SCENARIO.md`, `IDEAS.md`, `MINDMAP.md`, `TODO.md`.

---

## 1. Executive summary

**Voidspan** je perzistentní textově-strategická multiplayer hra s 8-bit estetikou (vzor **Dune II, Westwood 1992**). Hráči jsou kolonisté na orbitálním prstenci kolem cizí hvězdy; budují ekonomiku, instituce, skupiny, soutěží o claim, vyjednávají a konspirují. Hráč je **správce**, ne pracovník — nastavuje směr pro svoje **brains** (rule-based agent), který akce provádí offline.

**Rytmus:** ~1× denně, 10–20 minut session. Hra běží nepřetržitě (real-time + time-gated akce).

**Žánrový poměr:** 40 % hra / 40 % sociální experiment / 20 % umělecké dílo.

**POC cíl:** prototyp P1 hraný blízkými autora jako zdroj feedbacku.

---

## 2. Proč hra existuje (vize, účel)

### 2.1 Cílový hráč

| Fáze | Hráč |
|---|---|
| **POC (teď)** | Blízcí autora — nekritické, ochotné publikum pro rychlý feedback |
| **Aspiračně** | Teenager v sociálním kruhu — přichází přes pozvání vrstevníka, hledá komunitu, baví ho sociální drama a politika |

### 2.2 Zážitek, emoce, zkušenost

- **Zážitek:** peak moment = **pamatovatelný příběh**, i prohra (vzpoura → penal colony → amnestie).
- **Zkušenost (Tenet T4 kandidát):** hráč si zkusí být diktátor a **zažije úpadek vlastní civilizace** — lekce je zážitková, ne didaktická.

### 2.3 Autorská motivace (tři vrstvy)

1. Koncept v šuplíku — i rozpracovaný projekt je legitimní výstup.
2. Učení spolupráce s AI + mentální kondice + tvorba jako zábava.
3. Dialog s blízkými nad POC — konkrétní dosažitelný úspěšný stav.

**Leitmotiv:** „Cesta je cíl." Žádný deadline. Udržitelné tempo.

---

## 3. Designová identita

### 3.1 Žánr a forma

Text strategy, multiplayer, team competition, social experiment (spolupráce/zrada). **Obsah > forma.** Forma: 8-bit, 1D bays, Dune II look.

### 3.2 Narrative tenets — **kandidáti** (viz `IDEAS.md`)

- **T1 — Prequel stays open:** historie před hrou doplnitelná bez retconu.
- **T2 — Drones ≠ Players:** automatizace jen údržba/defenziva, ne politika.
- **T3 — Foundations before curtains:** KISS, izomorfismus.
- **T4 — Forgiveness rewarded:** mechaniky odměňují tit-for-tat s odpuštěním.

<span style="color:red">**GAP:** Tenety jsou zatím kandidáti, ne pevný kánon. Potvrdit nebo zamítnout praxí POC.</span>

### 3.3 Setting a prolog

- Orbitální prstenec (Belt) kolem cizí hvězdy.
- Hráč je **uprchlík ze Země** (prolog záměrně mlhavý: provinění/trest vs. elita/mise).
- Prequel otevřený (T1).

---

## 4. Mechanika hry

### 4.1 Prostor a čas

- **Belt:** prstenec ze segmentů kolem hvězdy. Obvod `CONST_BELT_LENGTH`. Uzavírá se do kruhu.
- **Segment:** jeden dílek beltu, 8×2 grid bays (16 slotů). Hlavní prostorový kontejner.
- **Bay:** jeden slot v segmentu (layered axiom S18 — vrstvy `void / skeleton / covered / module_root / module_ref`). Každá vrstva má HP.
- **Module:** funkční jednotka obsazující 1–N bays (Habitat, SolarArray, MedCore, Engine 2×2 …). Modul má vlastní HP_MAX a stavy (offline/online/decaying).
- **Hub / Port:** počáteční segment, obsahuje instituce (Katastr, Soud, Banka, Šerif), nedestruktibilní.
- **Module Binding Protocol:** hráč je **lokálně vázán na modul**. Naming convention `MODULE_TYPE.Name` (např. `DOCK.The_Threshold`, `PRISON.Barack2`, `HABITAT.Luxury_House`).
- **Čas:** real-time, hra běží nepřetržitě. Akce jsou **time-gated** (duration minuty–hodiny).
- **Entropie:** nepečované bays/moduly postupně chátrají (HP klesá pod prahy → decaying → lost).

<span style="color:red">**GAP:** Přesný tick/tempo entropie, CONST hodnoty, decay rychlost nejsou specifikovány.</span>

<span style="color:red">**GAP (Q-World-1):** Po revizi R1 (multi-colony) není vyjasněn fyzický vztah mezi belty — jedna hvězda / soustava / galaxie? Cestování, obchod, válka mezi belty závisí na této odpovědi.</span>

### 4.2 Postava hráče (POC schéma)

| Dimenze | Popis | POC | Phase 2+ |
|---|---|---|---|
| **STATUS** | Aktuální role v kontextu (Dělník, Výzkumník, Vězeň, Občan) | ✓ | |
| **RANK** | Pozice v hierarchii občanství + rolí (Indenture/Probationary/Full; rekrut→generál) | ✓ | |
| **SKILL** | Naučená dovednost, roste praxí (Geologie 5) | ✓ | |
| **PERK** | Unlock z rozhodnutí (Radiation Resistance) | | ✓ |

**Alts (R3):** více účtů povoleno, integrováno jako feature — každý život = nová kapsle, legacy přes Citizen Tiers.

### 4.3 Brains — core POC feature

Brains je **rule-based agent**, který za hráče provádí akce offline podle nastavených priorit.

- **Slidery:** práce ↔ studium, obrana ↔ expanze, komunikace ↔ samota (3–5 os).
- **Scope T2 (POC):** pouze **materiál & provoz** (oblast 3.3.1). Politika, konflikt, diplomacie čekají na hráče.
- **Paleta akcí:** určena `STATUS × MODULE_TYPE`. Brains vybírá z palety podle sliderů.

<span style="color:red">**GAP (Q-Brains-Schema):** UX brains — kolik sliderů, granularita, kategorie, vizualizace — nenavrženo. **Toto je blokátor implementace P1.**</span>

### 4.4 Oblasti hry (3.3.1 – 3.3.6)

Šest konsolidovaných větví. Detaily v `IDEAS.md` (Oblasti hry — master list).

| Oblast | Obsah | Priorita POC |
|---|---|---|
| 3.3.1 Materiál & provoz | Ekonomika (Resource Model v0.1: E/W/S/F/◎), infrastruktura, údržba | **MUST** |
| 3.3.2 Výměna | Obchod, diplomacie | must-minimum |
| 3.3.3 Řád | Politika, právo, justice | **MUST** (minimální parlament + spor o claim) |
| 3.3.4 Společnost | Skupiny 3-tier (underground/unofficial/official), migrace | **MUST** (základní skupiny) |
| 3.3.5 Konflikt | Válka, sabotáž, rebelie | Phase 2+ |
| 3.3.6 Vědění | Věda, média, kultura, paměť | Phase 2+ |

### 4.5 Zdroje

**Resource Model v0.2** (axiom — viz `GLOSSARY.md` §Resources). Pět os:

- **Energy (E)** — rate + storage; slunce, baterie, pohonné jednotky.
- **Work (W)** — throughput lidské/dronové práce (power_w × čas).
- **Solids / Pevné (S)** — pevné a sypké látky (S25: rename `Slab → Solids`; food/metal/components subtypy parkoviště P2+).
- **Fluids / Tekutiny (F)** — kapaliny, plyny, plazma (S25: rename `Flux → Fluids`; air/water/coolant subtypy parkoviště P2+).
- **Coin (◎)** — univerzální měna (dříve „Kredo" / „Echo" ve v0.0, retirováno).

**FVP KISS** (S26): Solids a Fluids jsou ploché agregáty bez subtypů. Air + food + water odstraněny z modelu (S25 KISS — 24th-cent recyklace + food je atribut itemu, ne kategorie). Subtypy + item registr patří do P2+ Resource Taxonomy (viz `TODO.md` + `GLOSSARY.md`).

### 4.6 Social layer

**Faction Hierarchy 4 × 3** (viz `IDEAS.md`):

| Úroveň | Underground | Unofficial | Official |
|---|---|---|---|
| Malá skupina | conspiracy | cech, klub | licensovaný spolek |
| Kolonie | tajná klika | zájmové hnutí | politická strana |
| Belt | odboj | občanská iniciativa | vládní blok |
| Koalice beltů | tajné spojenectví | neformální pakt | obranná aliance |

**Neprotokolovaná komunikace:** soukromé kanály mezi hráči **nejsou v event logu**. Vědomá slepá skvrna v experimentálních datech.

---

## 5. Oblouky (arcs)

Čtyři nezávislé časové osy. Detail v `SCENARIO.md`.

| Arc | Scope | Délka | Status |
|-----|-------|-------|:------:|
| **A Network Arc** | Síť beltů v serveru | měsíce–roky | <span style="color:red">EMPTY</span> |
| **B Colony Arc** | Jeden belt od založení po ending | dny–měsíce | partial (legacy sekce) |
| **C Player Arc** | Hráč od pozvánky po exit | hodiny–týdny | DONE |
| **D Session Arc** | Jeden login → logout | minuty–hodiny | DONE |

### 5.1 Player Arc (C)

```
1.0 Invitation       — pozvánka, motivační dopis, kapsle na orbitu
1.1 Awakening        — přijetí + briefing, první volba
1.2 Active Life      — brains drží akce, hráč řídí směrem
1.3 Exit             — Dispose / Migrate (→ loop A) / Delegate (Phase 2+)
```

### 5.2 Colony Arc (B)

```
2.1 Founding          — belt vzniká
2.2 Institutions      — vláda, soud, šerif
2.3 Crisis (⟲)        — iterovatelné krize
2.4 Approach          — závod o poslední cells
2.5 Closure           — Belt Closure Event (legacy event řádu 10M)
2.6 Post-Closure      — hustota, politika
2.7 Ending            — Flourish / Stagnation / Schism / Civil War / Extinction / Abandonment / Reset
```

<span style="color:green">**RESOLVED (S14):** Legacy Act -1 až Post-Closure struktura smazána. Detailní obsah přesunut do Appendix A (Invitation) a Appendix B (Awakening) jako detail pro Player Arc 1.0/1.1.</span>

### 5.3 Network Arc (A) — <span style="color:red">PRÁZDNO</span>

Aktivováno revizí R1. Závisí na Q-World-1.

### 5.4 Session Arc (D) — hráčův denní rytmus

```
D.1 Login      — character snapshot, dashboard, brains report, notifikace
D.2 Interact   — komunikace, obchod, brains config, political actions, diplomacie
D.3 Logout     — brains přebírá, kritické události → push/email
```

**Ilustrativní session (seed):** *Přihlásím se. Pozdravím ve skupinovém chatu. Najím se. Zajdu do obchodu. Upravím brains — méně práce, víc studia (Geologie III). Napíšu správní radě žádost o povýšení. Přečtu jejich odpověď na můj návrh na založení banky. Odhlásím se.*

---

## 6. Onboarding a identita

### 6.1 Invitation → Capsule → Awakening

1. **Pozvánka** (welcome / email / reklama) s motivační výzvou a **fiktivním IBAN** (narativní rekvizita, ne platba).
2. **Motivation Letter** v `[TEXT_AREA]` — zdůvodnění, proč má hráč být oživen. Součást world-lore.
3. **Capsule** — kryospánková schránka na orbitě, čeká na rozhodnutí vlády kolonie.
4. **Revival / Limbo / Recycling** — tři varianty.
5. **Awakening** (Act 0) — probuzení, briefing, první volba.

### 6.2 Citizen Tiers

- **Indenture** (kryo-dlužník) → **Probationary** → **Full Citizen**.
- Cesta vzhůru ústavně garantovaná (T3 kandidát).

### 6.3 Exit z hry

- **Dispose** — rozprodat, rozdat, opustit.
- **Migrate** — kapsle do jiné kolonie (→ Network Arc).
- **Delegate (API/AI)** — Phase 2+, overthinked.

### 6.4 Penal colony + amnesty (R2)

<span style="color:red">**GAP:** Mechanika penal colony a amnestie není rozpracována. Přímé napojení na T4 (odpuštění).</span>

---

## 7. Meta vrstva

### 7.1 World Browser
Mimoherní nástroj pro prohlížení více beltů (aktivních i historicky zaniklých). Po R1 = **active competition view**.

### 7.2 Legacy Letter Archive
Trvalý archiv všech motivačních dopisů (úspěšných i zrecyklovaných). Vzor pro nové žadatele.

### 7.3 Event log (~10M záznamů)
Pamět světa. Ve 40/40/20 poměru = **data pro experiment**, nejen atmosféra.

---

## 8. Monetizace

**Žádná real-money transakce v POC ani MVP.** Fiktivní IBAN v pozvánce = narativní rekvizita.

Potenciálně později: buymeacoffee nebo podobný **volitelný** model. Hra **nikdy** nebude pay-to-win / pay-to-revive / pay-to-skip.

---

## 9. Technika

### 9.1 Stack

| Vrstva | Volba |
|---|---|
| Runtime | **Node.js 22 + TypeScript** |
| Multiplayer | **Colyseus** (authoritative server, rooms, state diff) |
| DB (POC) | **SQLite** |
| DB (prod) | **PostgreSQL 16** |
| ORM | Drizzle nebo Prisma <span style="color:red">(TBD)</span> |
| Frontend | **Phaser 3** + TypeScript |
| Reverse proxy | **Caddy** (auto HTTPS) |
| Deploy (POC) | **Render free tier** (sleep acceptable) |
| Deploy (prod) | **VPS Linux Basic** (Forpsi, 160 Kč/měsíc, 2 vCPU, 4 GB RAM) + systemd |
| Monorepo | **pnpm workspace** (`apps/server`, `apps/client`, `packages/shared`) |

### 9.2 DNS

`bete1geuse.com` → A record na VPS IP (až po prototypu na Renderu).

### 9.3 Art pipeline

- 8-bit pixel art, 1D bays, Dune II reference.
- Phaser `pixelArt: true`, `setRoundPixels: true`.
- Assety v `art/` složce, generované (arena.ai/Gemini) + ručně retušované.
- Mockup UI **v Phaseru**, ne z diffusion modelů.

### 9.4 Moderace

<span style="color:red">**GAP:** LLM moderation pipeline pro motivační dopisy, flagging, policy, ban policy — nenavrženo. Nezanedbatelný provozní náklad.</span>

### 9.5 Komunikace

- **Skupinový chat** — neprotokolovaný.
- **Institucionální mail** — správní rada, banka, parlament, šerif.
- **Čtecí boardy** — shop, news, event log.

<span style="color:red">**GAP (Q-Institutional-Mail):** Formát, protokol, timeline, viditelnost nenavržen.</span>

<span style="color:red">**GAP (Q-Comm-Privacy):** Rozsah neprotokolované komunikace (anti-abuse, moderace) nenavržen.</span>

---

## 10. OTEVŘENÉ OTÁZKY, MEZERY, VAROVÁNÍ, CHYBY

### 10.1 <span style="color:green">RESOLVED</span> (S5–S14)

- ✅ **E1** SCENARIO paralelní struktura — vyřešeno v **S14** (legacy Backbone smazán, §3/§4 → Appendix A/B).
- ✅ **W3** Resource Model propagace — vyřešeno v **S13** sweep (SPEC §4.5, IDEAS, GLOSSARY). `POC_P1.md` retirován S32.
- ✅ **Q-World-1** — vertikální stacking kolem Teegarden, adresa `Teegarden.BeltN` (S5).
- ✅ **Q12** — jméno hvězdy: Teegarden's Star (S5).
- ✅ **Q13** — `CONST_BELT_LENGTH = 256` (S5).
- ✅ **Q11** — žádná vítězná podmínka, peak = pamatovatelný příběh (S1–S4).
- ✅ **Q-Player-Schema** — STATUS + RANK + SKILL (S4).
- ✅ **Q9 Tempo** — time-gated, ~1×/den, brains drží prioritu (S4).
- ✅ **Q-P1-Arch / Telemetry / Input / Character / Tick / UI / Onboarding / Dialogs** — uzavřeny v S7, historický zápis byl v `POC_P1.md` (retirován S32, klíčová rozhodnutí migrována do `MINDMAP.md` + `GLOSSARY.md`).

### 10.2 <span style="color:red">ERRORS (blokátory)</span>

*Žádné otevřené.* (E1 uzavřeno v S14.)

### 10.3 <span style="color:red">WARNINGS</span>

<span style="color:red">**W1** — Brains vs. T2 napětí s alts (R3). Alt-farma s několika účty může obcházet T2 zákaz automatizace politiky. Policy nenavržena.</span>

<span style="color:red">**W2** — Tenety T1–T4 jsou **kandidáti, ne kánon**. Nelze je používat jako nepochybná pravidla v implementaci, dokud neprojdou POC playtestem.</span>

<span style="color:red">**W4** — 40 % experiment ratio opravňuje plný event log, telemetrii, replay. Implikuje **netriviální GDPR / privacy / data retention** povinnosti, nenavržené.</span>

<span style="color:red">**W5** (S13 audit)** — `GameScene.ts` monolit 748 LOC. Refactor na panely (Header/Segment/Actors) plánován pro S15. Neblokuje P1, blokuje kvalitní expansion P2+.</span>

### 10.4 <span style="color:red">GAPS (otevřené otázky)</span>

| ID | Otázka | Blokuje |
|---|---|---|
| <span style="color:red">Q-Brains-Schema</span> | UX brains sliders, kategorie, granularita | **P2+ implementace** (FVP skrz task-oriented input + QuarterMaster autopilot) |
| <span style="color:red">Q-Institutional-Mail</span> | Formát, protokol, timeline | Session Arc interakce |
| <span style="color:red">Q-Session-Rhythm</span> | Notifikace vs. přirozená zvědavost; anti-exploit | UX retence |
| <span style="color:red">Q-Comm-Privacy</span> | Rozsah neprotokolované komunikace, anti-abuse | Moderace |
| <span style="color:red">Q-Player-Origin</span> | Proč hráč uniká ze Země (varianty prologu) | Onboarding copy |
| <span style="color:red">Q14</span> | Orbital Shift cena, mechanismus | Phase 2 |
| <span style="color:red">Q-ORM</span> | Drizzle vs. Prisma | Server skeleton (P2+) |
| <span style="color:red">Q-Entropy</span> | Decay rychlost, entropy tick | Balancing |

### 10.4 <span style="color:red">EMPTY NODES</span>

- **Network Arc (4.3)** — prázdné, závisí na Q-World-1.
- **Scripted events (4.5)** — prázdné, 2 přístupy v TODO (tón / schéma).
- **Penal colony + amnesty (R2)** — koncept, žádný detail.
- **Moderation pipeline** — žádný návrh.

---

## 11. Kritéria ukončení přípravné fáze

Dokument bude **validován / verifikován / kompletní**, jakmile:

### 11.1 Obsahové checklisty

- [ ] Všechny `GAP` z 10.3 buď zodpovězeny nebo **explicitně odloženy do Phase 2+** s odůvodněním.
- [ ] Všechny `ERRORS` z 10.1 vyřešeny (SCENARIO.md přerovnáno).
- [ ] Všechny `WARNINGS` z 10.2 mají mitigation plan.
- [ ] **Q-Brains-Schema** detailně rozepsáno — bez toho P1 nejde implementovat.
- [ ] **Q-Institutional-Mail** formát definován.
- [ ] **Colony Arc (5.2)** celý rozepsán včetně thresholdů a trigger podmínek.
- [ ] **P1 POC scope** má detailní mechanics spec (co je, co není, akceptační kritéria).

### 11.2 Technické checklisty

- [ ] Zvolen ORM (Drizzle / Prisma).
- [ ] Monorepo skeleton existuje (`apps/server`, `apps/client`, `packages/shared`).
- [ ] HelloWorld pilot (G2): WS spojení server↔klient, základní Colyseus room.
- [ ] Deploy na Render funkční (URL sdílitelná).
- [ ] Základní CI (lint + test).

### 11.3 Playtest checklist (P1)

- [ ] Jedna kolonie, 10 cells, 3–5 blízkých hráčů.
- [ ] STATUS + RANK + SKILL implementováno.
- [ ] Brains se 3 slidery funkční.
- [ ] Monopoly mýto loop funkční (claim → income → dispute).
- [ ] Institucionální mail minimální (1 instituce, 1 petice flow).
- [ ] Session Arc dodržen (login → interact → logout, brains offline progress).
- [ ] Feedback od min. 3 blízkých zaznamenán.

### 11.4 Dokumentační checklist

- [ ] `GLOSSARY.md` obsahuje všechny ustálené pojmy, žádné rozpory.
- [ ] `SCENARIO.md` jedna struktura (arcs A/B/C/D), žádná legacy paralela.
- [ ] `IDEAS.md` vytříděno — realizované přesunuto do GLOSSARY, zrušené do parkoviště.
- [ ] `TODO.md` aktuální, hotové v `DONE.md`.
- [ ] `MINDMAP.md` všechny uzly `[●]` nebo explicitně `[○]` s odkazem do TODO.

---

## 12. Reference

- `CLAUDE.md` — projektová pravidla
- `GLOSSARY.md` — pojmy
- `SCENARIO.md` — dramatický oblouk
- `IDEAS.md` — raw nápady a parkoviště
- `TODO.md` — úkoly
- `DONE.md` — hotové úkoly
- `MINDMAP.md` — stromová mapa projektu se stavy uzlů
- `.claude/sessions/YYYY-MM-DD.md` — logy sezení

---

**Konec specifikace v0.1 DRAFT.** Dokument je **úmyslně nekompletní** — prázdná místa a varování (sekce 10) představují reálný stav přípravné fáze. Jejich zaplnění = ukončení fáze.
