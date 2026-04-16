# IDEAS.md — ⊙ Voidspan

Raw nápady a inspirace. Nezralé myšlenky patří sem. Konkrétní úkoly → `TODO.md`. Ustavené pojmy → `GLOSSARY.md`. Narativní scénář → `SCENARIO.md`.

## Status tree + Colony Goal (S20 — kandidát na kánon)

Raw zápis diskuse ze sezení 20. Uzavře se **jiným přístupem** (user TBD); Q2–Q10 zůstávají otevřené do té doby.

### Axiom kandidáti

**A. Colony Goal (single axiom):**
> Jediný GOAL hry/simulace = **trvale udržitelný život a rozvoj člověka**.
> Kompas směru: **hodně živých (a později šťastných) lidí s dobrou perspektivou.**
> Goal ≠ win condition — je to **kompas**, ne cílová čára. Sladěné s MINDMAP §1.2 ("peak = pamatovatelný příběh, ne score") a Endings Spectrum (bez terminálního stavu).

**B. Perpetual Observer Simulation axiom:**
> Simulace **nemá terminální stav**. Svět žije dokud běží server — bez hráčů, bez NPC, i když všechny entity mají HP=0. Přidání hráče = resume, ne restart. Hru končí **správce vypnutím serveru**, ne herní událost.
> Perspektiva axiom: **Observer** nemá WIN/LOSS; **Player** má GAME_OVER (P2+). WIN/LOSS puzzle v P1 byl **onboarding test**, ne kánon.

**C. Status tree (stav kolonie = posádka + základna):**
> Fraktální strom ukazatelů zdraví kolonie. Synonyma (Posádka/Kolonisté/Crew) neřešit — alias.
> Struktura:
> ```
> Status
>  ├── I. Aktuální stav
>  │   ├── I.1 Posádka  (kvantita + kvalita)
>  │   └── I.2 Základna (kvantita + kvalita)
>  ├── II. Udržitelnost (vyhlídky — přežití)
>  │   ├── II.1 Zásoby kolonistů (vzduch, voda, jídlo — runway + trend)
>  │   └── II.2 Entropie základny (repair vs. decay rate)
>  ├── III. Rozvoj (vyhlídky — expanze)       [P2+ pahýl]
>  │        migrace, rozmnožování, pás, expedice
>  └── IV. Společenský kapitál                 [P2+ pahýl]
>           důvěra, politická stabilita, koheze
> ```
> Agregace: **parent = worst child** (fraktální semafor red/orange/green) — potvrzeno.
> FVP scope = I.1 kvantita + I.2 + II.1 + II.2. Zbytek **placeholdery** / „Bla bla" stubs, all-green. Uzly mimo FVP dostanou v GLOSSARY jen pahýl + odkaz „detail v budoucí iteraci".

**D. Maslow axiom:**
> Osy I–IV jsou **nezávislé dimenze** (kolonie má hodnotu na každé). Ale strategie investic je **hierarchická** — vrstvu N lze efektivně budovat jen na pevné N-1. Inspirace: Maslowova pyramida potřeb.

### Pojem
- **FVP = First Viable Product.** Ne P1 POC (ten byl puzzle), ale minimální observable simulation sandbox, který ukážeme playtestrům P1–P4.

### Otevřené otázky (user: rozlouskne jiným přístupem)

- **Q2** I.1 kvantita metrika — count, ratio k Habitat kapacitě, nebo jiné?
- **Q3** I.1 kvalita metrika v P1 — ∑HP aktérů / ∑HP_MAX jako pahýl?
- **Q4** I.2 kvantita metrika — osazené bays / funkční moduly / plocha?
- **Q5** I.2 kvalita metrika — agregované HP per vrstva, nebo vážené?
- **Q6** II.1 runway — min(food_days, air_days, water_days) v game-days do 0?
- **Q7** II.2 entropie — net HP trajectory; ale v P1 není decay model, pahýl `0`?
- **Q8** III + IV pahýly — jen název + 1–2 věty + „P2+" flag?
- **Q9** Observer dashboard UX — rozšířit Top Bar, nebo nový floating panel „STATUS" (hotkey `S`)?
- **Q10** Top Bar teď ukazuje `PHASE A — HULL BREACH` + `LOSS (air)`. Axiom B to retiruje. Refaktor kdy — hned, nebo po zápisu Status tree do GLOSSARY?

### Event Log — otevřené myšlenky (S20)

- **Lazy filter chips** — chip pro verb se objeví až při prvním výskytu. Čistší UI při startu, roste organicky. Potvrzeno S20 (GLOSSARY kánon); zde parkujeme variace: chipy se řadí podle recency (poslední objevený vlevo)? Podle abecedy? Podle počtu výskytů?
- **Click-through navigation (P2+)** — klik na event s `loc` = camera jump + bay select. Velký UX win pro Observer. V FVP odloženo; nic nelinkovat v textu eventů, ať se to neopře o křehký schéma.
- **Event merge / coalesce** — 40 stejných `TICK` za minutu zaplácne log. Nápad: sdružit do `TICK × 40` (count badge) s timestamp range. Ne pro FVP (komplikace), ale nápad do banku.
- **Replay / export** — P2+: uložit event stream JSON, přehrát simulaci z logu pro debugging + playtest analýzu.
- **Colored actor badges** — jako v PocketStory inverzní background per actor id. Pro Voidspan pozor — můžeme použít vlastní lehký tint (ne plný invert), drží se paletové sémantiky.

### Důsledky pro FVP scope (k rozhodnutí)
- **Simulation-first, not puzzle-first:** FVP = observable svět s automatikou dronů, výrobou, obchodem; **NPC přidat později**, živí hráči **úplně naposledy**.
- Současný `world.ts` má `Phase = boot | phase_a | ... | win | loss` + `toLoss()` + early-return pro win/loss. V Observer axiomu **zmizí win/loss**; phase jako onboarding tutorial milník může zůstat nebo se taky retiruje.
- POC_P1.md §18 WIN/LOSS dialogy přepsat jako **events v Event logu**, ne modaly.
- Kolonisté: `state="dead"` jako legitimní terminální stav *aktéra*, ne simulace. Air=0 → HP drain aktérů, ne `toLoss`.
- A3 bezdomovectví — už diskutováno dříve, HP drain mechanika existuje; vazba na Status tree I.1 kvalita přijde později.

---

## QuarterMaster upgrade path (S24)

QuarterMaster je **verzovaný SW** autopilota (runtime Protokolu). Startovní verze `v2.3`. Upgrade přes výzkum (Q6 Vědění, 3.3.6).

**Uvažované verze:**
- **v2.3 (FVP)** — auto-repair orchestrace, E/W gate, eternal monitor task, paused/resume. Implementováno.
- **v3.x — Integrated Defense:** koordinace Combat dronů (asteroidy, piráti, sabotáž). Napojení na T2 axiom (drones ≠ players ofenziva) — Protokol smí defenziva, ofenziva jen hráč.
- **v4.x — Energy-aware balancing:** predictive load management. Protokol plánuje repair/build/service dle přicházejícího světla (solar forecast).
- **v5.x — Multi-colony coordination:** Belt Network R1. Protokoly sousedních beltů si vyměňují signály (obchod, alarm, migrace).
- **v6.x — Cultural reflexes:** Protokol reaguje na Vyhlášky a Plány z knowledge base přímo (dnes je jen implicit přes pravidla).

Aktuální verze se zobrazuje v headeru eternal service tasku: `QuarterMaster v2.3 — Active/Paused/Idle/Standby`. Upgrade = změna `World.protocolVersion` + rozšíření kódu.

**Otevřené:** Q-Protocol-Upgrade-Cost (co stojí upgrade v Coin / Slab / výzkumných bodech), Q-Protocol-Downgrade (lze se vrátit k starší verzi při poruše?).

---

## Drone capacity types (S23)

Drony = nakoupená kapacita, přeměňující E (energii) na specifický typ výkonu. Player není dron — je to hráčův avatar (kolonista).

FVP: jen **pracovní drony** (Constructor → W). Budoucí typy:

- **a) Pracovní kapacita (W)** — Constructor dron. Staví, opravuje, demontuje. Implementováno.
- **b) Přepravní kapacita** — Transport dron. Přesouvá moduly, zásoby, kapsle. Nahrazuje retirovaný Hauler.
- **c) Pořádková kapacita** — Patrol dron. Bezpečnost, vymáhání pravidel, vězeňský dozor.
- **d) Vojenská kapacita** — Combat dron. Obrana proti asteroidům, pirátům, sabotáži.

Drony se v FVP neprezentují jednotlivě — jsou agregátní kapacita. Vizualizace: celkový W bar v Top Baru, breakdown v infotipu.

Ekonomika dronů: nákup za ◎, provoz stojí E/tick. Poškozený dron (HP < 100%) produkuje méně W (HP ratio axiom).

---

## Koncept & téma

- **Vesmírná kolonie**, gold rush / Minecraft server vibe. Belt jako domov, frontier jako divočina před uzavřením prstence.
- **Nehostinná prázdnota** — Void jako aktivní antagonista.
- **Zlatá horečka v kosmu** — kolonisté přicházejí, umírají, claims zůstávají.
- **V6 — Cizí hvězda**: nový svět, nová pravidla, žádné dědictví Země.

## Topologie (ustaveno v GLOSSARY)

Prstenec kolem cizí hvězdy. Vertikální pás cells. Uzavírá se postupně do kruhu.

### Orbitální mechaniky
- **Orbital Shift** = kolektivní povýšení / snížení orbitu. Globální dopady na Energy (E), teplotu, rok.
- Víceúrovňové belty jako pokročilá fáze hry.

### Entropie
- Cells chátrají (DEVELOPED → DECAYING → LOST).
- Trhlina v uzavřeném beltu = globální katastrofa.
- Tempo entropie: pomalé (dny), aby netrestalo offline hráče.

### Ekonomika (monopoly + bublina + recyklace)
- Vlastník cell = vybírá mýto.
- Spekulativní bubliny nad claims.
- **Resource Model v0.1** (kánon, viz `GLOSSARY.md` / `SPECIFICATION.md` §4.5): 5 os **E / W / S / F / ◎**. Starý termín „Echo" → Energy, „Kredo" → Coin. Vedlejší zdroj z **recyklace kapslí** → Coin.
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

### Capsule hunting research (Phase 2+)

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

## Oblasti hry — master list (bod 3.3 v mapě)

Šest konsolidovaných větví pokrývajících sociologii, politiku, ekonomiku a další dimenze civilizace. Každá větev se později rozbalí do samostatné kapitoly.

| Větev | Obsahuje | Provedení VOIDSPAN | Hráčské role |
|---|---|---|---|
| **3.3.1 Materiál & provoz** | výroba, vlastnictví, údržba, entropie | E/W/S/F produkce, claim cell, mýto, drone repair, boj proti decay | Builder, Landlord, Spekulant, Technik, Správce |
| **3.3.2 Výměna** | obchod, diplomacie | Směna S↔◎, E↔◎, intra-belt trasy, karavany mezi belty (R1), smlouvy, obranné pakty | Trader, Kupec, Caravan Master, Diplomat, Vyjednavač |
| **3.3.3 Řád** | politika, právo, justice | Parlament, volby, dekrety, koalice, soud, zákony, amnestie, penal colony, spory o claim | Politik, Řečník, Koaliční lídr, Soudce, Advokát, Šerif |
| **3.3.4 Společnost** | skupiny 3-tier + migrace | **Underground** (tajné) / **Unofficial** (cechy, kluby) / **Official** (strany, aliance). Review kapslí, citizenship path, kvóty. Neprotokolovaná komunikace. | Organizátor, Špion, Vůdce, Immigration advokát, Komisař |
| **3.3.5 Konflikt** | válka, sabotáž, rebelie | Útok/obrana cells, sabotáže, povstání, mezi-kolonijní válka (R1) | Stratég, Voják, Sabotér, Generál, Rebel |
| **3.3.6 Vědění** | věda, média, kultura, paměť | Capsule hunting tech, orbital shift tech, anti-entropy, event log interpretace, noviny, propaganda, Legacy Archive, kroniky | Vědec, Inženýr, Novinář, Propagandista, Archivář, Pisatel, Historik |

**POC scope (P1):** stačí 3.3.1 + 3.3.3 + minimum 3.3.4. Ostatní Phase 2+.

**T4 kompas:** 3.3.3 (amnestie) a 3.3.4 (odpuštění po konspiraci, návrat z penal) jsou hlavní nositelé Forgiveness rewarded.

**Vědomě nezařazeno:** náboženství/ideologie a zdraví/populace. Když vyvstanou z praxe, přidá se 3.2.7.

---

## Action palette seeds (Player Arc 1.2)

První nástřely palet akcí pro kombinaci STATUS × CELL. Neúplné, kanonizovat až s Q-Player-Schema a Q9.

**Dělník @ CELL_UNDERCONSTRUCTION:**
- Pracuj (staveb. úkon → ◎/XP)
- Komunikuj se sousedy (chat, neprotokolované)
- Jdi [target cell]
- Najez se (Slab.food cost)
- Spi (Energy regen)
- Poptávej (trh, nákup)
- Nabízej (trh, prodej)
- Zaútoč (pokud povoleno status + místo)

**Výzkumník @ CELL_ADMINISTRATION.Greenhouse:**
- Zkoumej (výběr technologie → XP, unlock)
- [~40 akcí — TBD, rozepsat]
- Jdi na úřad → ADMINISTRATION_HALL
  - Vyžádat doklady
  - Volit v parlamentu
  - Kandidovat
  - Podat žalobu / obhajobu

**Principy tvorby palety:**
- **Action = STATUS × MODULE_TYPE.** Každá kombinace má jinou paletu.
- **Pohyb je akce**, ne teleport. Čas + šance na setkání.
- **Paleta je konečná a zobrazitelná** v UI (text buttons, jako DUNE II menu).

## Brains — core POC feature (revize S4)

**Dřívější klasifikace „delegace Phase 2+" byla chybná.** Brains jsou **jádro hráčova zážitku**, ne opcionální proxy. Bez brains je session prázdná — hráč jen čeká.

**Co brains dělá:**
- Drží **slidery priorit:** práce ↔ studium, obrana ↔ expanze, komunikace ↔ samota.
- Volí akce z palety dané STATUS × CELL (viz Action palette seeds).
- Běží **offline** — hráčovy hodiny offline = brains hodiny aktivity.
- Drží v T2 scope **(a) materiál & provoz** — politika/konflikt čekají na hráče (mail, hlasování, dekrety).

**Co brains NEdělá v POC:**
- Nepíše maily institucím.
- Nehlasuje, nekandiduje, neuzavírá aliance.
- Nevyhlašuje útok, nepodepisuje smlouvy.

**UX:** `Q-Brains-Schema` v TODO. Minimální POC sliders: 3–5 os.

## Pokročilá delegace (API, AI) — Phase 2+

Nad brains ještě dva režimy, **overthinked a odložené**:

1. **API** — hráč píše vlastního bota, Screeps-style. Design-ceiling vysoký, publikum úzké.
2. **AI (LLM)** — proxy s LLM, kontext hráčova profilu. Mocné, nebezpečné (T2), drahé.

**Otevřené pro Phase 2+:**
- Q-Delegate-Scope: co smí nad brains.
- Q-Delegate-Cost: platí se CPU/Energy/Coin za běh.
- Q-Delegate-Audit: vidí hráči, kdo má zapnutou.
- Q-Delegate-Abuse: alt-farma s 5× API.

## Faction Hierarchy (4 úrovně × 3 typy) — detail k 3.3.4

Hráč může být současně členem více skupin napříč úrovněmi. Tři typy sociality: **underground** (tajné, neviditelné), **unofficial** (známé, neformální), **official** (formální, s pravomocí).

| Úroveň | Underground | Unofficial | Official |
|---|---|---|---|
| Malá skupina | conspiracy, kabal | cech, klub | licensovaný spolek |
| Kolonie (parlament) | tajná klika | zájmové hnutí | politická strana |
| Celý belt | podzemí, odboj | občanská iniciativa | vládní blok |
| Koalice beltů | tajné spojenectví | neformální pakt | obranná aliance |

**Neprotokolovaná komunikace:** Soukromé kanály mezi hráči (chat, zprávy) **nejsou v event logu**. Vědomá slepá skvrna v datech experimentu (bod 5.3). Viz `TODO.md` Q-Comm-Privacy pro rozsah a anti-abuse.

## Tenet kandidáti (přesunuto z GLOSSARY v S4)

Tyto principy byly původně zapsány v GLOSSARY jako „neporušitelné". Reálně jsou to **kandidáti/nástřely** — testovat praxí a potvrdit/zamítnout až po POC. Neodkazovat na ně v designu jako na pevný kánon.

- **T1 — Prequel stays open:** historie před začátkem hry se může kdykoli doplnit kompatibilně, bez retconu.
- **T2 — Drones ≠ Players:** automatizace jen údržba/defenziva, ne ofenziva/expanze/politika. Napětí s R3 (alts): alt-farma jako potenciální obcházení.
- **T3 — Foundations before curtains:** KISS, izomorfismus, základy před detaily. (Metodologie — duplikováno v 7.5.)
- **T4 — Forgiveness rewarded:** mechaniky odměňují tit-for-tat s odpuštěním (Axelrod). Nejsilnější, zároveň nejhůř měřitelný.

## Prolog — Únik ze Země (Setting 2.3)

Global scope: **hráč uniká ze Země.** Motiv je **záměrně mlhavý**:
- Provinil ses něčím → toto je trest/vyhnanství?
- Patřil jsi k elitě, máš mimořádné schopnosti → toto je mise?
- Něco jiného?

Mlhavost je feature, ne bug — dovoluje různým hráčům promítnout různé identity. Propisuje se do **3.1 (kdo je hráč mechanicky)** a do narativu motivačního dopisu.

**Estetika:** 8bit old school, **1D bays**, reference **DUNA1**. Primitivní forma, bohatý obsah.

## Revize z S4 (2026-04-12) — bod 1 mapy

### R1 — Multi-colony pivot
Voidspan není jediný belt proti entropii, ale **síť beltů v konkurenci**. Kolonie se brání/útočí/obchodují/migrují. World Browser se mění z pasivního archivu na **aktivní mapu konkurence**. Frakční dynamiky (4.4) jsou i mezikolonijní, ne jen uvnitř kolonie.

### R2 — Penal colony + amnesty
Nová herní mechanika. Místo pro hráče odsouzené za politický/násilný zločin. Amnestie = kolektivní akt odpuštění, přímo implementuje Tenet T4. Peak zážitek z persony („organizace vzpoury → trestanecká kolonie → naděje v amnestii") závisí na této mechanice.

### R3 — Alts policy: povoleno a integrováno
Více účtů/e-mailů **přípustných**. Ne zakazovat ani vymáhat restrikce — **integrovat jako feature**: každý život = nová kapsle, legacy přes citizen tiers a Legacy Letter Archive. Hráč si může „založit další život" jako designový prvek.

## Belt Network — vertikální stacking (S5, doplněk R1)

Kolem Teegardenovy hvězdy **víc beltů na různých orbitech**. „Nad námi" / „pod námi" = vertikální vrstvy okolo jedné hvězdy. Adresování `Teegarden.BeltN`. 

Důsledky pro design:
- **Orbital Shift = pohyb beltu mezi vrstvami** (ne jen změna poloměru). Kolektivní akt s fyzickým dopadem na sousední belty.
- **Observatory Event** (viz SCENARIO §5.A) = narativní start Belt Network vrstvy.
- **Mezi-kolonijní doprava:** kapsle, průzkumné lodi, obchodní karavany přes orbity. Pravděpodobně drahé (Energy-intenzivní), aby se vrstvy daly odlišit kulturně i politicky.
- **Interference:** jeden belt může zastínit solar produkci jiného — emergentní zdroj konfliktu.

## Mýto a poplatky — varianty (S5, do POC jen základ)

**P1 core mechanika (v TODO):** základní mýto za průchod segmentem (monopoly dynamika).

**Varianty pro Phase 2+:**
- **Ubytování** — platba za nocleh v cizím Habitatu (alternativa HOMELESS drain).
- **Daň z nemovitosti** — pravidelný odvod majiteli segmentu vlastníkovi vyšší autority (kolonie, belt).
- **Vstupné do kolonie** — poplatek cizímu kolonistovi za vstup do hub-segmentu.
- **Celní poplatky** — mezi-beltový obchod v R1.
- **Parkovné kapsle** na orbitě (alternativa timeout recyklace).
- **Pojištění claimu** proti entropii / útoku.

Variant se nebudeme držet všech — testovat v POC a rozhodnout podle toho, které generují zajímavé rozhodování a které jen šum.

## Marshal → Specializace (S5)

Univerzální Marshal drony jsou **počáteční kompromis** (analogie Module Specialization). Jak kolonie dospěje, výzkum odemyká dedikovanou flotilu:

- **Police** — zatýkání, hlídka.
- **Medics** — záchranka, první pomoc v terénu.
- **Firefighters** — požáry, havárie infrastruktury.
- **Judiciary AI** — asistence soudu v Low-Complexity případech (lidský soudce drží autoritu).
- **Admin AI** — administrativa kolonie (katastr, daně, evidence).

**Emergentní napětí:** kolektivním rozhodnutím nebo nehodou může počet Marshals klesat, než kolonie stihne vyrobit dedikované nahrazení. Krátká období s nízkou `lawlessness` pokrytím = crisis event pool.

**T2 napětí:** Marshals jsou drony vykonávající násilí (Fight CP 8). Pokud T2 drží „drones ≠ players" jako ofenziva-only-human, pak **Marshals musí pracovat na lidské autorizaci** (šerif-hráč dává rozkaz, dron vykonává). Phase 2+ rozhodnutí.

---

## HP-unified damage axiom (S16)

Sjednocení 4 mechanik (konstrukce / dekonstrukce / oprava / poškození) do jedné osy: **HP**.

### Datový model
- Každá instance **Module** musí mít `hp` a `hp_max` (dnes má jen `hp` + `max_hp` v `MODULE_DEFS` — sjednotit tak, že `hp_max` se kopíruje z katalogu do instance při create).
- Každá instance **Bay** musí mít `hp` a `hp_max`. Empty bay = `hp = hp_max` (nepoškozený floor). Damaged = `hp < hp_max`. Rozestavěné = `hp` roste z 0.
- Model-first: axiom „instance nese stav, katalog nese definici (max, cost, …)".

### Mechaniky jako HP transformace
- **Konstrukce:** `hp` roste spojitě z 0 → `hp_max` podle `wd_done / wd_total`.
- **Oprava:** `hp` roste z aktuální → `hp_max`.
- **Dekonstrukce:** `hp` klesá → 0 (pak instance → empty / recyklace).
- **Asteroid hit:** `hp -= damage` skokově (vzorec níže).
- **Entropie (P2+):** `hp` klesá pomalu bez údržby (DEVELOPED → DECAYING → LOST).

### Univerzální vizuál — „damaged overlay"
- Každá instance s `hp < hp_max` dostane **červený fill overlay**, alpha 0.6.
- Intenzita úměrná `1 - hp/hp_max` (TBD — lineárně, nebo jen on/off?).
- Izomorfismus: stejný vizuál = stejná info („něco tu není v pořádku, dá se to opravit"). Damaged / rozestavěné / poškozené asteroidem — hráč vidí úkol bez dalších UI prvků.
- Analogie žlutého selection rámečku, ale **fill** (ne stroke), červený, vždy-on když podmínka platí.

### Asteroid damage vzorec — TBD
- Skoková změna `hp` při impaktu.
- Varianty:
  - Fixní damage per asteroid kind (malý / velký).
  - Damage ∝ kinetická energie (mass × velocity²).
  - Splash damage na sousední bays podle průměru.
- Rozhodnout při kalibraci P2+ asteroid eventů.

### Otevřené otázky
- **Damaged → empty transition:** kdy se bay po repair vrátí do „plného" stavu? Když `hp=hp_max`, nebo když je task hotov? (Model-first: `hp=hp_max` = jediná podmínka, task je jen mechanismus, jak tam HP doplnit.)
- **Konstrukční ghost:** rozestavěný modul jako průhledný sprite + červený fill (hp nízké). Finish → fill zmizí spojitě.
- **Dekonstrukce vs. asteroid hit:** oba snižují HP, UI rozliší podle přítomnosti `demolish` tasku na instanci.
- **Akcelerace:** paralelní zdroje změny HP (oprava + asteroid současně) — net `Δhp = Σ sources`.

---

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

## UI Layer Stack axiom (S19)

Vrstevnatý z-order od dekorace k nejmodálnějšímu prvku. Izomorfní: výš = interaktivnější a naléhavější. **Vrstvy 4 (overlay texty) nejsou striktně hierarchické** — jsou context-triggered nad vším, kde se vyskytne `<link>text</link>`.

### Vrstvy

- **0. Hvězdné pozadí** — automatický denní cyklus driftu (7 px / 240 s wall = game day). WASD shift budoucnost, pokud bude třeba.
- **1. Kosmické sprity** — asteroidy, kapsle kolonistů, obchodní a dopravní prostředky, možná animovaný roj constructor/logistic/agent dronů.
- **2. BELT** — epicentrum dění. Řada většinou sousedních segmentů, rozrůstá se vertikálně (nahoru/dolů). Sub-ordering uvnitř: base sprite → HP overlay → selection → labels. *Vyžaduje samostatnou kapitolu (Q-Belt-Topology).*
- **3. Ukotvené panely Top / Main / Bottom** — texty **bez pozadí**. Zvažuje se **průhledný panel** pro Top/Bottom + BELT protáhnout pod nimi (vertikální scroll nebude zastaven okrajem).
- **3.5 Floating workspace** (parkoviště, implementace odložena) — panely K/U/Z/E/P, toggle hotkey, persist dokud hráč nezavře. Ne modální, nad Mainem, pod overlay texty.
- **4. Link-triggered overlays** — všechny texty v boxu na průhledném `#hull-dark`. Kontextově vyvolané linkem; nestojí v pevné hierarchii, umí být nad modálem (5.x). Gradient průhlednosti: dark / mid / light podle hustoty obsahu.
  - **4.1 Infotip** — nejtenčí rámeček, monochromatický plaintext, autoclose (hover pryč / click-out / časovač). Např. tooltip nad časomírou.
  - **4.2 Karta** — širší rámeček, ASCII + text, barvy, autoclose.
  - **4.3 Popover** — 8-bitový styl wikipedia popoverů (barvy + grafika), autoclose.
- **5. Modální okna** — vyžadovaná volba (Close button + ESC globálně). **Nezastavují čas.** Hra pokračuje, hráč čte pod tlakem efektivity — respektuje real-time design + TIME_COMPRESSION.
  - **5.1** Jednoduché info + Zavřít: Help, Info, Win, Loss, Mapa.
  - **5.2** Velké přehledy s ovládacími prvky: Výzkum, Obchod, Ekonomika, Zdroje, Politika.
  - **5.3** Nastavení.
  - **5.4** Chat s hráči, hlasování, komunikace.

### Globální axiomy

- **ESC = bezpečný odchod** z jakéhokoli dialogu (4.x i 5.x). Druhé stisknutí toggle hotkey panelu = zavřít.
- **#hull-dark** je jediné povolené pozadí overlay textů. Mid / light varianty povoleny pro gradient dle vrstvy 4.1 → 4.3.
- **Texty ukotvených panelů (3) bez pozadí** — vizuální oddělení od BELTu řeší buď průhledný panel s jemným okrajem, nebo zúžení orbit dekoru. Detail otevřený (Q-UI-Chrome-Separator).
- **Modální nezastavují čas** — žádná pauza přes modál. Jediný legitimní pause = explicitní Pause feature (P2+).

### Otevřené otázky

- **Q-Belt-Topology:** vertikální growth BELTu + kolize s Top/Bottom Bar — průhledný panel s protaženým BELTem pod ním? Alternativa: fade overlap, clip na okraji.
- **Q-UI-Chrome-Separator:** jak vizuálně oddělit Bottom Bar od Main bez pozadí textu.
- **Q-Modal-Stack:** může být 5.x nad 5.y (např. Chat 5.4 otevřený z Politiky 5.2)? Nebo max 1 modál naráz?
- **Q-WinLoss-Buttons:** P1 Win/Loss screen — Close / Restart / Quit?
- **Q-Floating-Panels-Home:** K/U/Z/E/P — parkoviště dokud neřešíme (A2). Až přijde řada, rozhodnout: layer 3.5 vs. promo do layer 3 (ukotvené)?

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
