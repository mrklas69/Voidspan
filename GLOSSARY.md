# GLOSSARY.md — ⊙ Voidspan

Jediný zdroj pravdy pro klíčové pojmy projektu. Když se pojem mění, mění se zde. Ostatní dokumenty (IDEAS, TODO, SCENARIO, sessions, kód) se na tento glosář odvolávají.

Verze: **v0.4** (Sezení 6 — SHIP revidován na 1 segment, POC_P1 puzzle scope, `CONST_PUZZLE_SLACK_FACTOR`).

---

## Cosmology & Lore

### Setting — Teegarden System

Vzdálená hvězdná soustava kolem reálné hvězdy **Teegardenova hvězda** (Teegarden's Star, SO J025300.5+165258). Lidská kolonie staví **Belt** (orbitální prstenec) okolo této hvězdy. Soustava může hostit **více beltů na různých orbitách** (vertikální stacking) — viz `Belt Network` níže.

### Premise

Přicházejí kolonisté z mateřské civilizace (Země / odjinud — prequel otevřený). **Nový svět s novými pravidly** — žádné dědictví minulosti, instituce se budují od nuly. Noví hráči = další vlny kolonistů (onboarding narativně ukotven, viz `Capsule`, `Founding Colonist Invitation` a Player Arc v SCENARIO).

### Století (Earth reference)
TBD. Volně upřesnitelné později bez konfliktu s existujícím kánonem.

---

## Narrative Tenets

**Přesunuto do `IDEAS.md` jako kandidáti** (S4). Tenety T1–T4 nejsou ustálený kánon, ale nástřely k ověření praxí.

---

## Spatial Hierarchy — entity světa

Rozhodnuto v S5. Pět úrovní, od globální po atomickou:

```
WORLD → BELT → SEGMENT → MODULE → TILE
```

### WORLD
Jeden server Voidspanu = jeden WORLD. Obsahuje jednu hvězdnou soustavu (**Teegarden System**). Hostí jeden nebo více beltů.

### BELT
Kolonijní prstenec na konkrétní oběžné dráze kolem hvězdy. Obvod = `CONST_BELT_LENGTH` segmentů (= **256**). Před uzavřením = lineární pás se dvěma konci, po uzavření = kruh bez konců. Sousední segmenty indexováno `(i-1) mod N` a `(i+1) mod N`.

**Belt Network (R1):** více beltů na různých orbitech jedné hvězdy. Adresování `Teegarden.BeltN.SegXXX…`. Naše startovní kolonie = **Belt1** (default). Objevení dalších beltů = `Observatory Event` (narativní spouštěč).

### SEGMENT
Jeden z `CONST_BELT_LENGTH` dílků beltu. Obsahuje grid **2×8 = 16 tiles** (`CONST_SEGMENT_VOLUME`). Má horního a dolního souseda podél prstence. Stavy: `EMPTY → DEVELOPED → DECAYING → LOST`.

Segment je zároveň kontejner hráčova stavu — viz `Cell Binding Protocol` (název protokolu zachován; označuje fyzickou lokalizaci hráče do segmentu).

### MODULE
Funkční stavební celek v segmentu. Zabírá **1..N tiles** v Tetris/Pentomino layoutu. Největší přípustný modul = celý `CONST_SEGMENT_VOLUME`. Typy modulů viz sekce *Module Types* níže.

**Module Specialization Principle:** integrované multi-purpose moduly (malé, 1×1) mají **minimální výkon a kapacitu**. Dedikované jednoúčelové stavby (velké, až celý segment, s personálem) jsou řádově výkonnější (příklad: 1 lůžko v MedCore vs. 1024 lůžek v plné Nemocnici). Upgrade curve = motivace specializovat se, jakmile kolonie dospěje.

### TILE
Atomická jednotka prostoru (1 políčko gridu segmentu). Jeden modul může zabírat víc tilů; jeden tile však vždy patří nejvýše jednomu modulu. Pro stavbu většího modulu je nutné **vybourat** potřebné tiles.

### Adresa
`Teegarden.BeltN.SegXXX.MYY.TZ`  
Např. `Teegarden.Belt1.Seg042.M03.T5` = Teegarden System, belt 1, segment 42, modul 3, tile 5.

### Hub
**Flag** na segmentu (`segment.is_hub = true`), ne vlastní entita. Hub-segmenty jsou nedestruktibilní a hostí instituce (**Katastr**, **Soud**, **Banka**, **Šerif**, **Parlament** — postupně se odštěpují z `CommandPost`). Kolektivně vlastněné.

---

## Module Types (startovní a odvozené)

Startovní sada na palubě `SHIP` (viz SHIP konfigurace). Další moduly vznikají výzkumem a stavbou.

| Modul | Rozměr (typ.) | Role |
|---|---|---|
| **SolarArray** | 2×2 | Produkce energie W (napájí drony a moduly) |
| **Storage** | 2×2 a větší | Sklad Kredo/Echo, zásoby jídla |
| **Habitat** | 1×1 (start) | Bydlení (cryo-lůžka, ložnice, kuchyň, sport, kultura). `CONST_HABITAT_CAPACITY = 8`. Větší habitat = lineárně škálovaná kapacita × efekt Module Specialization. |
| **MedCore** | 1×1 (start) | Integrovaná kryo + nemocnice + márnice + research. Slabé. Postupně se odštěpuje do dedikovaných Hospital / Cryobank / Morgue / Lab. |
| **Assembler** | 1×1 | Výroba modulů a dílů. Bez něj kolonie nestaví. |
| **Recycler** | 1×1 (start integrován do MedCore/Storage) | Zpracování odpadu → raw materiál / nutrient. |
| **CommandPost** | 1×1 | Politika, katastr, šerif, **Observatory** (integrovaně) — postupně se odštěpuje do dedikovaných institucí. |
| **Engine → Dock** | 2×2 | Původně motory generační lodi, **rozebere se** jako první stavební úkol a přestaví na přístav pro kapsle. |
| **Greenhouse** | TBD | **Ve SHIPu CHYBÍ** — první stavební cíl kolonie. Bez něj dojde jídlo. |

Další moduly (Hospital, Cryobank, Morgue, Lab, Parlament, Bank, Court, Sheriff Office, Observatory-dedicated, Armory, …) = odemykány výzkumem a stavbou.

---

## SHIP — startovní konfigurace kolonie

Mateřská loď generačního typu, **zaparkovaná na orbitě Teegardenu**. Zabírá **jeden segment** (Belt1.Seg000). Celkem `CONST_SEGMENT_VOLUME = 16` tiles. Startovní posádka `CONST_FOUNDING_CREW = 8` v kryospánku, probouzí se postupně podle příchozích pozvánek (viz `Founding Colonist Invitation`).

> Revize S6: Původní návrh S5 počítal se SHIP přes 2 segmenty, ale modulová math se vešla do jednoho (14/16 tiles) s menšími moduly (1×1 místo 2×2). KISS + izomorfismus vítězí — **P1 i plný SHIP sdílí stejnou 1-segment konfiguraci**.

**SHIP (Seg000), 14/16 tiles využito, 2 tiles volno:**

| Modul | Rozměr | Tiles | Stavy |
|---|---|---|---|
| Habitat (+cryo pro posádku) | 1×1 | 1 | built / occupied |
| SolarArray | 1×1 | 1 | day-lit / night |
| Storage | 1×1 | 1 | — |
| MedCore (kryo + nemocnice + márnice + research) | 1×1 | 1 | — |
| Assembler | 1×1 | 1 | — |
| CommandPost (+integrovaná Observatory) | 1×1 | 1 | — |
| Engine → Dock | 2×2 | 4 | intact / dismantling / removed → empty / building / docked |
| `[empty]` (budoucí výstavba) | — | 4 | — |

**Recycler** na začátku integrován do MedCore (morgue→nutrient) a Storage (odpad→raw).
**Greenhouse** na startu NENÍ — v narativu „parkuje u SHIPu", připojí se po dostavbě Docku.
**Flotila modulů** (Greenhouse, 2. Habitat, 2. SolarArray) = silueta vedle SHIPu, čeká na Dock.

---

## Energy Model (W / WD)

Jednotná mechanika pro **hmotnou práci** (stavba, demontáž, přesun materiálu, produkce). Ne pro hlídku / léčbu / boj — ty mají vlastní metriky v `Capability Matrix` níže (Varianta A, úzký scope).

- **`W` (watt):** okamžitý výkon jednoho aktora v roli `Build` nebo `Haul`.
- **`WD` (watt-day):** jednotka práce. Každá akce má `cost_WD`.
- **`duration_days = cost_WD / Σ(W_aktorů)`**
- **Příklad (A18):** demontáž Engine stojí **120 WD**. Při 4 Constructor (4×10) + 1 hráč (8) = 48W → **2,5 dne** hry. Výstup: +4 Echo, +80 Kredo, Dock slot odemčen.

**Napájení:** `SolarArray 2×2 = 48 W` (provisional, pokrývá přesně 4 Constructory + 1 hráče). Energetický limit omezuje počet simultánně aktivních aktorů — úvodní „max 4 drony" plyne z 1 SolarArray.

**Aktér v kryo = 0 W**, aktér spící v habitatu (schedule slot `Sleep`) = 0 W produkce, aktér hladový / HOMELESS ztrácí HP (viz níže).

---

## Capability Matrix (role a výkony)

Actor se v schedule slotu věnuje **jedné roli současně** (`Specializace`, KISS). W/WD platí pro Build/Haul. Ostatní role používají `CP` (Capability Points) — např. Guard 10 CP = jeden dron pokryje 10 CP-tiles území, Heal 4 CP = rychlost léčení na lůžku.

Nástřel čísel (kalibrace v P1 playtestu):

| Actor | Build W | Haul W | Guard CP | Heal CP | Fight CP |
|---|---|---|---|---|---|
| Player (human) | 8 | 8 | 4 | 2 | 4 |
| Constructor drone | 10 | 4 | 0 | 0 | 0 |
| Hauler drone | 0 | 10 | 0 | 0 | 0 |
| Marshal drone | 0 | 6 | 10 | 4 | 8 |

Matice je **feeder do globálních VARS** (belt.lawlessness, belt.construction_rate, belt.healing_capacity…), které vstupují do triggerů / eventů / nákladů / příjmů.

---

## Drone Fleet

Startovní pool SHIPu = **16 dronů**: 8 Constructors + 4 Haulers + 4 Marshals.

### Constructors
Stavba, demontáž, produkce. 10W Build, 4W Haul.

### Haulers
Přeprava materiálu, 10W Haul.

### Marshals
**Multi-funkční** policie + IZS + admin (analogie Module Specialization). Startovní univerzální drony se slabými výkony napříč Guard/Heal/Fight/Haul. Při dospělosti kolonie se nahrazují **dedikovanou specializovanou flotilou** (Police, Medics, Firefighters, Judiciary AI, Admin AI).

### Lawlessness formula (KISS)

```
belt.lawlessness = max(0, 1 - marshals_active / CONST_MARSHAL_BASELINE)
# 0.0 = plné pokrytí, 1.0 = anarchie
# Ovlivňuje: šance úspěchu trestných činů, výši pokut, délku trestu.
```

`CONST_MARSHAL_BASELINE = 4` (startovní pool). Počet Marshals může klesat kolektivním rozhodnutím nebo nehodou — **jediná veličina s globálním dopadem na belt RULES**.

---

## Time

### Jednotky
- **Základní jednotka:** `1 sekunda` (wall clock).
- **Odvozené:** minuta = 60 s, hodina = 3600 s.
- **Herní den:** `CONST_DAY_HOURS = 16` (16 herních hodin; izomorfie s RimWorld 16 schedule slotů).

### Time Compression
`CONST_TIME_COMPRESSION ≈ 16×` (nezávazně): 1 wall-clock hodina ≈ 1 herní den. 1 herní hodina ≈ 3,75 wall-clock minuty. Finální poměr se doladí v P1.

### Schedule activities (RimWorld-style, P1 set)
Brains scheduler má 16 hodinových slotů denně. Aktivity pro P1 POC:

`Work | Eat | Sleep | Relax | Move`

Rozšíření (Study, Pray, Socialize, Guard pro hráče, …) → IDEAS / Phase 2+. **Guard v P1 vykonávají Marshals**, ne hráči.

---

## Player Status & Health

### Housing State
- `HOUSED` — má lůžko v Habitatu. Zakládající posádka SHIPu je HOUSED garantovaně.
- `HOMELESS` — bez lůžka. **HP drain ~1 HP / herní hodina** (provisional). Oddalitelné kvalitní stravou, relaxem, léčením. Bez zásahu umírá do ~4 dní hry.

### Sit-out (A3 + A16)
Odchod hráče = brains pokračuje podle nastaveného presetu. Offline hráč bez brains configu → pasivně nedělá nic, může zemřít hlady. Není to imunita (ne-poker). Hráč offline > 30 dní → převedení na NPC; jeho cryo-slot může být uvolněn pro novou pozvánku.

---

## Resources

### Echo
Solární palivo (fotovoltaika). Produkce = funkce orbitu a pozice segmentu vůči hvězdě. Pohon života, pohybu, běžných akcí.

### Kredo
Stavební zdroj (hmota, materiál). Získává se těžbou, recyklací, dovozem. Funkce: stavba, upgrady, oprava. **Recyklace kapslí** (viz *Capsule*) je vedlejší zdroj Kredo + Echo.

---

## Onboarding & Citizenship

### Invitation (Pozvánka)
Marketing/narativní vstup: welcome stránka, email, reklama. Obsahuje motivační výzvu a **fiktivní bankovní účet** (narativní rekvizita, žádná reálná transakce).

**Dva typy pozvánky** (od S5):
- **Founding Colonist Invitation** (*„Staň se zakládajícím kolonistou!"*) — pro prvních `CONST_FOUNDING_CREW = 8` hráčů beltu. **Oživení v rovnocenném postavení zaručené.** Žádná nejistota recyklace.
- **Capsule Invitation** (*„Hail Mary"*) — pro pozdější vlny. Kapsle na orbitu, nejistota (revival / limbo / recycling).

### Motivation Letter
Text `[TEXT_AREA]`, kterým hráč zdůvodňuje svou žádost o budoucí oživení. Součást world-lore, přežívá recyklaci v **Legacy Letter Archive**.

### Capsule
Kryospánková schránka s hráčem, deponovaná na orbitě cílové kolonie. Čeká na rozhodnutí vlády: revival / limbo / recycling. Pouze u `Capsule Invitation`, ne u `Founding Colonist`.

### Hail Mary
Neformální protokol kapslové žádosti hráče.

### Revival / Recycling
Viz SCENARIO sekce 4 a 12.

### Legacy Letter Archive
Trvalý archiv všech motivačních dopisů (úspěšných i zrecyklovaných) jako vzdělávací vzorek.

### Citizen Tier
Právní strata kolonisty (po Act 0). Tři úrovně: **Indenture**, **Probationary**, **Full Citizen**. Cesta vzhůru ústavně garantovaná. Zakládající posádka startuje jako Full Citizens (Founding Colonist Invitation).

---

## Events

### Belt Closure Event
Dokončení prstence (spojení posledního segmentu s hubem). Historická událost řádu ~10M v event logu. Ceremonie, jednorázové v rámci iterace beltu.

### Orbital Shift
Kolektivně rozhodnuté povýšení / snížení orbitu beltu. Globální dopad: Echo, teplota, délka roku, radiace. V Belt Network (R1) = pohyb beltu mezi vertikálními vrstvami.

### Capsule Arrival Event
Každá nová kapsle na orbitě = event. Vláda kolonie ji musí posoudit (aktivně) nebo přijde timeout (auto-recyklace).

### Observatory Event
**První detekce jiného beltu** v soustavě. Narativní spouštěč přechodu z izolace (Belt1 solo) na R1 Belt Network. *„Naše observatoř zaznamenala novou mateřskou loď na orbitě… Nejsme sami."* Probíhá přes `CommandPost.Observatory` (integrovaná), později dedikovaný Observatory modul.

---

## Meta-layer

### World Browser
Mimoherní nástroj pro prohlížení více beltů současně (aktivní i historické). Zaniklé belty dostupné jako archiv EventLogů.

### Iteration (Iterace beltu)
Jeden běh Colony Arc (Founding → Ending). Po *Reset* zakončení může vzniknout nová iterace.

---

## Design Constants

| Konstanta | Význam | Hodnota |
|---|---|---|
| `CONST_BELT_LENGTH` | Obvod prstence v segmentech | **256** |
| `CONST_SEGMENT_VOLUME` | Tiles v segmentu (grid 2×8) | **16** |
| `CONST_HABITAT_CAPACITY` | Lidí v 1×1 Habitatu | **8** |
| `CONST_FOUNDING_CREW` | Zakládající posádka v kryo | **8** |
| `CONST_DAY_HOURS` | Herních hodin v herním dni | **16** |
| `CONST_TIME_COMPRESSION` | Poměr wall-clock / herní čas | **~16×** (nezávazně) |
| `CONST_MARSHAL_BASELINE` | Baseline Marshals pro lawlessness=0 | **4** |
| `CONST_HOMELESS_HP_DRAIN` | HP ztráta bezdomovce / herní hod | **1** (provisional) |
| `CONST_CAPSULE_TIMEOUT` | Timeout rozhodnutí o kapsli | TBD (hodiny / 1–2 dny) |
| `CONST_RECYCLE_YIELD_ECHO` | Echo výnos z recyklace kapsle | TBD |
| `CONST_RECYCLE_YIELD_KREDO` | Kredo výnos z recyklace kapsle | TBD |
| `CONST_DECAY_DEV_TO_DECAYING` | Trvání fáze DEVELOPED bez údržby | TBD (3–7 dní?) |
| `SHIP_SOLARARRAY_POWER` | W jedné SolarArray 1×1 | TBD (S5 hodnota 48 W platila pro 2×2, re-derive pro 1×1) |
| `CONST_PUZZLE_SLACK_FACTOR` | Timeout / budget = `factor × optimum` v puzzle módu | **2** |

---

## Deprecated / Parkováno

- **`Cell` jako entita** (S5) — nahrazeno hierarchií SEGMENT/MODULE/TILE. Dříve používaný pojem „Cell" = **segment**. Parkováno; v kódu nepoužívat.
- **SHIP přes 2 segmenty** (S5) — revidováno v S6 na 1 segment. SHIP-Bow / SHIP-Stern naming retired.
- **Binární strom jako topologie** — nahrazeno prstencem. Parkováno v IDEAS.md.
- **Fork event / forks** — nahrazeno Belt Closure Event a Orbital Shift. Parkováno v IDEAS.md.
- **Rift** (třetí zdroj) — zrušeno po pivotu.
- **`CONST_FORK_LIMIT`** — zrušeno s forky.
- **Paid entry / real-money monetizace** — zrušeno v sezení 3.
