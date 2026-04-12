# IDEAS.md — Voidspan

Raw nápady a inspirace. Nezralé myšlenky patří sem. Konkrétní úkoly → `TODO.md`. Ustavené pojmy → `GLOSSARY.md`. Narativní scénář → `SCENARIO.md`.

## Koncept & téma

- **Vesmírná kolonie**, gold rush / Minecraft server vibe. Belt jako domov, frontier jako divočina před uzavřením prstence.
- **Nehostinná prázdnota** — Void jako aktivní antagonista.
- **Zlatá horečka v kosmu** — kolonisté přicházejí, umírají, claims zůstávají.
- **V6 — Cizí hvězda**: nový svět, nová pravidla, žádné dědictví Země.

## Topologie (ustaveno v GLOSSARY)

Prstenec kolem cizí hvězdy. Vertikální pás cells. Uzavírá se postupně do kruhu.

### Orbitální mechaniky
- **Orbital Shift** = kolektivní povýšení / snížení orbitu. Globální dopady na Echo, teplotu, rok.
- Víceúrovňové belty jako pokročilá fáze hry.

### Entropie
- Cells chátrají (DEVELOPED → DECAYING → LOST).
- Trhlina v uzavřeném beltu = globální katastrofa.
- Tempo entropie: pomalé (dny), aby netrestalo offline hráče.

### Ekonomika (monopoly + bublina + recyklace)
- Vlastník cell = vybírá mýto.
- Spekulativní bubliny nad claims.
- Dva zdroje: **Echo**, **Kredo**. Vedlejší zdroj z **recyklace kapslí**.
- Ceny a výnosy ovlivněné pozicí cell vůči hvězdě (sluneční / stinná strana).

### NPC-správce (offline proxy)
- Defenzivní automatizace — údržba, upkeep, opravy. Tenet **T2**.
- Úrovně programování k rozhodnutí: presety / bloky / skript.
- Otevřené: mohou být NPC terčem útoku/hacku?

### Instituce kolonie
- **Katastr**, **Soud**, **Šerif**, **Banka**, **Parlament**.
- Nedestruktibilní cells v hubu, kolektivní.

### Hráčský oblouk
- Landing v hubu → onboarding questy → výbava.
- Volba: stabilní mzda vs. volatilní jackpot.
- Sub-hub emergence na vzdálených klastrech claims.

## Onboarding & Recruitment (rozšíření z Act -1)

### World Browsers

Mimoherní nástroj pro prohlížení **více beltů současně**. Klíčový meta-koncept.

- Více aktivních kolonií v síti (server hostí N paralelních beltů).
- **Zaniklé kolonie zůstávají přístupné** jako EventLog archiv — jejich historie přežije konec.
- Použití:
  - Hráč v pre-game ghost experience (čeká na rozhodnutí o kapsli).
  - Hráč posuzující, kam poslat další kapsli (do které kolonie má šanci).
  - Historici / antropologové kolonií (meta-game).
  - Autoři hry studující emergentní vzorce.
- Designová paralela: **wayback machine pro vymyšlené světy**.
- Výtvarně: World Browser = futuristická knihovna / archivní konzole / monument zaniklým koloniím.

### Motivační dopisy jako kulturní artefakt

- Úspěšné dopisy v Legacy Letter Archive = **vzor pro nové žadatele**.
- Kultura pisatelství: v kolonii může vzniknout **tradice** hodnocení / komentáře dopisů.
- Potenciálně: instituce **Archivář** s hráčskou rolí (čte, kategorizuje, doporučuje).

### Capsule hunting research

- Výzkumný strom odemyká pokročilé technologie pro kolonii.
- **Auto-hunter kapslí** — dron / AI, který proaktivně sbírá a třídí kapsle podle nastavení.
- Pokročilá fáze hry — kolonie s mnoha hráči delegují rozhodování o kapslích na autonomní systém.
- Etická dimenze: kdo programuje filtr? Kdo kontroluje, že je spravedlivý?

### Moderation pipeline (provozní)

- LLM pre-filter pro motivační dopisy (vulgarity, spam, rizika).
- Hráčské flagging + review.
- Hard limits (délka, frequency per IP).
- Ban policy.
- Provozně nezanedbatelný náklad — započítat do roadmapy.

### Forgiveness-rewarded mechaniky (T4)

- Ekonomika: dlouhodobá reputace > krátkodobý zisk ze zrady.
- Politika: volby mají paměť, voliči si pamatují.
- Justice: odpuštění je formalizovaný akt (milost, amnestie, restituce).
- **Výchovný efekt** na hráče-diktátory = explicitní designový cíl, ne vedlejší produkt.

## Prequel — otevřený narativ

Tenet **T1**. Dějová pole (všechna opcionální):
- Generační loď dorazila po stoletích.
- Víc vln kolonizace (Evropa / Asie / Mars / ...).
- Země ztracená / mýtická.
- Důvod odletu: ekonomický útěk / mise / sekta / vyhnanství.
- Zakládající listina kolonie (dokument s pravidly).

## Inspirace
- *EVE Online* — sandbox ekonomika, corp politika.
- *Screeps* — programovatelné entity.
- *Rust / DayZ* — PvPvE persistence.
- *FTL / Sunless Sea* — křehký cestovatel v nehostinném prostoru.
- *Travian / Farmville* — real-time tick, vrací se denně.
- *Monopoly* — mýto, realitní napětí.
- *Dwarf Fortress* — priority system pro NPC.
- *Ringworld (Niven)*, *Halo*, *Iain Banks: Orbitals* — prstencová topologie.
- *Elysium*, *Interstellar* — orbitální útočiště jako kulturní tropus.
- *Death Stranding* — asynchronní hráčská interakce přes zprávy.
- *Dark Souls messages* — hráčské textové artefakty jako součást světa.
- *Axelrod — The Evolution of Cooperation* — prisoner's dilemma, tit-for-tat s odpuštěním (Tenet T4).
- *Zlatá horečka* — historická analogie ekonomiky.

## Otevřené nápady k rozpracování

- Greenhorn reinkarnace.
- Kolonijní měna emitovaná bankou.
- Volby šerifa / starosty.
- Veřejné zakázky (most přes trhlinu).
- Pojištění claimů proti entropii.
- Sezónní eventy (komety, supernovy).
- **Event log s ID řádu 10M** — váha světa.
- **Asymetrie sluneční / stinné strany** beltu.
- Planety / měsíce v soustavě jako **outposty**.
- **Role „Archivář"** — hráčská pozice spravující Legacy Letter Archive.
- **Paralelní belty v síti** — server hostí víc kolonií, hráči migrují mezi nimi přes kapsle.

---

## Parkoviště — zrušené / odložené koncepty

### Binární strom jako topologie
Původně (S1): binární strom s rekurzivním větvením. **Zrušeno v S3** ve prospěch prstence.

### Fork event
Původně: větvení = vzácná serverová událost. **Zrušeno** s binárním stromem. Nahrazeno Belt Closure Event + Orbital Shift.

### Rift (třetí zdroj)
Původně: rizikový zdroj pouze z forků. **Zrušeno po pivotu.**

### CONST_FORK_LIMIT
**Zrušeno** s forky.

### Paid entry monetizace
Původně zvažováno (S3): platba za nalodění. **Zrušeno** — free hra, fiktivní účet v pozvánce jen jako narativní rekvizita. Možná buymeacoffee později.
