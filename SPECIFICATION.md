# SPECIFICATION.md — Voidspan

**Souhrnná zadávací dokumentace projektu Voidspan.**

Cílem tohoto dokumentu je poskytnout **úplný a sebe-nosný zdroj** pro programování, nasazení a rozvoj aplikace. Kompletní validovaný dokument **ukončí přípravnou fázi** projektu.

**Verze:** v0.1 DRAFT (2026-04-12, sezení 4) — **nekompletní, viz sekci 10 a 11**.
**Status:** <span style="color:red">**PREPARATION PHASE — NOT YET VERIFIED**</span>

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

Text strategy, multiplayer, team competition, social experiment (spolupráce/zrada). **Obsah > forma.** Forma: 8-bit, 1D tiles, Dune II look.

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

- **Belt:** prstenec z cells kolem hvězdy. Obvod `CONST_BELT_LENGTH`. Uzavírá se do kruhu.
- **Cell:** obdélníková jednotka, stavy `EMPTY → DEVELOPED → UPGRADED → DECAYING → LOST`.
- **Hub / Port:** počáteční segment, obsahuje instituce (Katastr, Soud, Banka, Šerif), nedestruktibilní.
- **Cell Binding Protocol:** hráč je **lokálně vázán na cell**. Naming convention `CELL_TYPE.Name` (např. `DOCK_CELL.The_Threshold`, `PRISON_CELL.Barack2`, `HABITAT_CELL.Luxury_House`).
- **Čas:** real-time, hra běží nepřetržitě. Akce jsou **time-gated** (duration minuty–hodiny).
- **Entropie:** nepečované cells postupně chátrají (DEVELOPED → DECAYING → LOST).

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
- **Paleta akcí:** určena `STATUS × CELL_TYPE`. Brains vybírá z palety podle sliderů.

<span style="color:red">**GAP (Q-Brains-Schema):** UX brains — kolik sliderů, granularita, kategorie, vizualizace — nenavrženo. **Toto je blokátor implementace P1.**</span>

### 4.4 Oblasti hry (3.3.1 – 3.3.6)

Šest konsolidovaných větví. Detaily v `IDEAS.md` (Oblasti hry — master list).

| Oblast | Obsah | Priorita POC |
|---|---|---|
| 3.3.1 Materiál & provoz | Ekonomika (Echo/Kredo), infrastruktura, údržba | **MUST** |
| 3.3.2 Výměna | Obchod, diplomacie | must-minimum |
| 3.3.3 Řád | Politika, právo, justice | **MUST** (minimální parlament + spor o claim) |
| 3.3.4 Společnost | Skupiny 3-tier (underground/unofficial/official), migrace | **MUST** (základní skupiny) |
| 3.3.5 Konflikt | Válka, sabotáž, rebelie | Phase 2+ |
| 3.3.6 Vědění | Věda, média, kultura, paměť | Phase 2+ |

### 4.5 Zdroje

- **Echo** (solární palivo) — život, pohyb, akce.
- **Kredo** (stavební zdroj) — stavba, upgrady, opravy.

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

<span style="color:red">**WARNING:** SCENARIO.md obsahuje paralelně novou arc strukturu (§2) I legacy strukturu („Act -1 až Post-Closure"). Nutno přerozdělit.</span>

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

- 8-bit pixel art, 1D tiles, Dune II reference.
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

### 10.1 <span style="color:red">ERRORS (blokátory)</span>

<span style="color:red">**E1** — `SCENARIO.md` obsahuje **dvě paralelní struktury** (nová arcs + legacy Act -1 až Post-Closure). Nutné přerozdělit před implementací, jinak hrozí nekonzistence.</span>

### 10.2 <span style="color:red">WARNINGS</span>

<span style="color:red">**W1** — Brains vs. T2 napětí s alts (R3). Alt-farma s několika účty může obcházet T2 zákaz automatizace politiky. Policy nenavržena.</span>

<span style="color:red">**W2** — Tenety T1–T4 jsou **kandidáti, ne kánon**. Nelze je používat jako nepochybná pravidla v implementaci, dokud neprojdou POC playtestem.</span>

<span style="color:red">**W3** — Revize R1 (multi-colony) nebyla promítnuta do `GLOSSARY.md` a `SCENARIO.md`. Tyto dokumenty stále implicitně předpokládají jeden belt.</span>

<span style="color:red">**W4** — 40 % experiment ratio opravňuje plný event log, telemetrii, replay. Implikuje **netriviální GDPR / privacy / data retention** povinnosti, nenavržené.</span>

### 10.3 <span style="color:red">GAPS (otevřené otázky)</span>

| ID | Otázka | Blokuje |
|---|---|---|
| <span style="color:red">Q-World-1</span> | Fyzický vztah mezi belty (1 hvězda / soustava / galaxie) | Network Arc, 3.1 topologie |
| <span style="color:red">Q-Brains-Schema</span> | UX brains sliders, kategorie, granularita | **P1 implementace** |
| <span style="color:red">Q-Institutional-Mail</span> | Formát, protokol, timeline | Session Arc interakce |
| <span style="color:red">Q-Session-Rhythm</span> | Notifikace vs. přirozená zvědavost; anti-exploit | UX retence |
| <span style="color:red">Q-Comm-Privacy</span> | Rozsah neprotokolované komunikace, anti-abuse | Moderace |
| <span style="color:red">Q-Player-Origin</span> | Proč hráč uniká ze Země (varianty prologu) | Onboarding copy |
| <span style="color:red">Q12</span> | Jméno hvězdy | Setting polish |
| <span style="color:red">Q13</span> | `CONST_BELT_LENGTH` | P1 scope |
| <span style="color:red">Q14</span> | Orbital Shift cena, mechanismus | Phase 2 |
| <span style="color:red">Q-ORM</span> | Drizzle vs. Prisma | Server skeleton |
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
