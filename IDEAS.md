# IDEAS.md — Voidspan

Raw nápady a inspirace. Nezralé myšlenky patří sem. Konkrétní úkoly → `TODO.md`.

## Koncept & téma

- **Vesmírná kolonie**, gold rush / Minecraft server vibe. Přístav jako hub, frontier jako divočina.
- **Nehostinná prázdnota** — Void jako aktivní antagonista (entropie, rozpad, pohlcování).
- **Zlatá horečka v kosmu** — kolonisté přicházejí, umírají, claims zůstávají.

## Mechaniky

### Geometrie & růst
- Binární strom zakořeněný v přístavu (~10 políček).
- Expanze dvěma směry z hubu, pak rekurzivní větvení.
- **Growth je drahý** — větvení = serverová událost, spotřebuje kolektivní zdroje + práci.
- Udržet zábavu na **malém počtu políček** (hustota > expanze).

### Entropie
- Neopravovaná políčka chátrají.
- Pás se může **trhat** → vznikají izolované ostrovy claimů.
- Trhliny přemostitelné (drahá repair expedice).
- Tempo entropie: pomalé (dny), aby neterestovala offline hráče.

### Ekonomika (monopoly + Ponzi)
- Vlastník políčka = vybírá mýto za průchod.
- Hodnoty claimů rostou spekulativně → bublina → kolaps.
- Tři zdroje: Echo (palivo), Kredo (stavba), Rift (riziko, jen z forků).
- Ceny a úrody ovlivněné vzdáleností od hubu.

### NPC-správce (offline proxy)
- Defenzivní automatizace — údržba, platba upkeepu, opravy.
- **Nesmí umět ofenzivu ani expanzi** (jinak hráč hraje vždy).
- Úrovně programování k rozhodnutí: presety / vizuální bloky / skript.
- Otevřené: mohou být NPC terčem útoku/hacku?

### Instituce kolonie
- **Katastrální úřad** — registrace vlastnictví.
- **Soud & advokáti** — spory, dědictví, pozůstalost.
- **Šerif** — vymáhání práva. Pomocník šerifa = placená práce (quest).
- **Banka** — úvěry, spekulace, možná emise kolonijní měny.
- Instituce = nedestruktibilní políčka v hubu, kolektivní.

### Hráčský oblouk
- Landing v hubu → onboarding questy → zajištění výbavy.
- Volba: pracovat pro kolonii (stabilní mzda) vs. riskovat claim (volatilní jackpot).
- Claim je **velmi drahý**, počáteční spoluvlastnictví víc hráči.
- Sub-hub emergence: když se na vzdáleném bodě stromu nahromadí claims, vzniká nové městečko.

## Inspirace
- *EVE Online* — sandbox ekonomika, corp politika.
- *Screeps* — programovatelné entity.
- *Rust / DayZ* — PvPvE persistence.
- *FTL / Sunless Sea* — krehký cestovatel v nehostinném prostoru.
- *Travian / Farmville* — real-time tick, vrací se denně.
- *Monopoly* — mýto, realitní napětí.
- *Dwarf Fortress* — priority system pro NPC.
- *Zlatá horečka* — historická analogie celé ekonomiky.

## Otevřené nápady k rozpracování

- Greenhorn reinkarnace: umřel-li kolonista, nový spawnuje v hubu, claims přetrvají.
- Kolonijní měna emitovaná bankou, směnitelná za Echo/Kredo.
- Volby šerifa / starosty — politická vrstva.
- Veřejné zakázky (stavba mostu přes trhlinu financovaná kolektivně).
- Pojištění claimů (banka pokrývá entropii za pravidelné splátky).
- Sezónní eventy (komety, supernovy) mění ceny a ohrožují pás.
