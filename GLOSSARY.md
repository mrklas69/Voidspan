# GLOSSARY.md — Voidspan

Jediný zdroj pravdy pro klíčové pojmy projektu. Když se pojem mění, mění se zde. Ostatní dokumenty (IDEAS, TODO, SCENARIO, sessions, kód) se na tento glosář odvolávají.

## Cosmology & Lore

### Setting
Vzdálená hvězdná soustava, cizí hvězda (konkrétní jméno TBD). Lidská kolonie začíná stavbou orbitálního prstence (**Belt**) kolem této hvězdy.

### Premise
Přicházejí kolonisté z mateřské civilizace (Země / odjinud — prequel otevřený). Toto je **nový svět s novými pravidly** — žádné dědictví minulosti, instituce se budují od nuly. Noví hráči = další vlny kolonistů (onboarding narativně ukotven, viz *Capsule* a Player Arc 1.0 v SCENARIO).

### Století (Earth reference)
TBD. Volně upřesnitelné později bez konfliktu s existujícím kánonem.

---

## Narrative Tenets

**Přesunuto do `IDEAS.md` jako kandidáti** (S4). Tenety T1–T4 nejsou ustálený kánon, ale nástřely k ověření praxí.

---

## Entities

### Belt
Kolonijní prstenec na oběžné dráze kolem hvězdy. Vertikální pás **cells**, postupně se uzavírající do kruhu. Obvod = `CONST_BELT_LENGTH` cells. Před uzavřením = lineární pás se dvěma konci. Po uzavření = kruh bez konců.

### Cell
Základní stavební jednotka beltu. Obdélníková, uniformní rozměry. Může nést 1 až N staveb (**upgrades**). Stavy: EMPTY → DEVELOPED → UPGRADED → DECAYING → LOST.

**Cell je zároveň kontejner hráčova stavu** — viz *Cell Binding Protocol*.

### Cell Binding Protocol
Hráč (= 1 účet) je **lokálně vázán na konkrétní cell**. Cell není jen zdrojový tile, ale **místo, kde hráč fyzicky je**. Naming convention: `CELL_TYPE.Name` (např. `DOCK_CELL.The_Threshold`, `PRISON_CELL.Barack2`, `HABITAT_CELL.Luxury_House`).

Tok hráče po přijetí:
```
WAITING_ROOM / CAPSULE
    ↓
DOCK_CELL.The_Threshold   (arrival processing)
    ↓
PRISON_CELL.Barack*   ∨   HABITAT_CELL.*
```

### Hub / Port
Počáteční segment beltu. Obsahuje instituce (**Katastr**, **Soud**, **Banka**, **Šerif**). Kolektivně vlastněno, nedestruktibilní. Ekonomicky dominantní — jediný bod s přístupem k institucím.

---

## Resources

### Echo
Solární palivo (fotovoltaika). Produkce = funkce orbitu a pozice cell vůči hvězdě. Pohon života, pohybu, běžných akcí.

### Kredo
Stavební zdroj (hmota, materiál). Získává se těžbou, recyklací, dovozem. Funkce: stavba, upgrady, oprava. **Recyklace kapslí** (viz *Capsule*) je vedlejší zdroj Kredo + Echo v malém množství.

---

## Onboarding & Citizenship

### Invitation (Pozvánka)
Marketing/narativní vstup: welcome stránka, email, reklama. Obsahuje motivační výzvu a **fiktivní bankovní účet** (narativní rekvizita, žádná reálná transakce — viz SCENARIO monetizační sekce).

### Motivation Letter
Text `[TEXT_AREA]`, kterým hráč zdůvodňuje svou žádost o budoucí oživení. Součást world-lore, čitelný kolonií při rozhodování. Přežívá recyklaci v **Legacy Letter Archive**.

### Capsule (Kapsle / „rakev")
Kryospánková schránka s hráčem, deponovaná na orbitě cílové kolonie po odeslání pozvánky. Objevuje se v event-logu kolonie. Čeká na rozhodnutí vlády: revival / limbo / recycling.

### Hail Mary
Neformální protokol nouzové žádosti hráče o přijetí. Metafora: vrhneš kapsli směrem ke kolonii a doufáš.

### Revival
Rozhodnutí kolonie kapsli přijmout a hráče oživit. Zahajuje Player Arc 1.1 (Awakening).

### Recycling
Rozhodnutí (aktivní nebo automatické po timeoutu) kapsli zlikvidovat pro surovinový výnos (malé množství Echo/Kredo). Kapsle a její motivační dopis zůstávají v Legacy Letter Archive jako historický záznam.

### Legacy Letter Archive
Trvalý archiv všech motivačních dopisů (úspěšných i zrecyklovaných). Slouží jako vzdělávací vzorek pro budoucí žadatele („které dopisy uspěly, které ne").

### Citizen Tier
Právní strata nového kolonisty. Tři úrovně:
- **Indenture** — kryo-dlužník s minimálními právy, patron systém.
- **Probationary** — probační občan s většinou práv kromě parlamentu.
- **Full Citizen** — plnoprávný občan.

Cesta vzhůru mezi tiers je **ústavně garantovaná** (Tenet T3 kandidát).

---

## Events

### Belt Closure Event
Dokončení prstence (spojení posledního cell s hubem). Historická událost řádu ~10M v event logu. Ceremonie, legacy záznam, jednorázové v rámci iterace beltu.

### Orbital Shift
Kolektivně rozhodnuté povýšení / snížení orbitu beltu vkládáním / odebíráním segmentů. Globální dopad: intenzita Echo, výnos fotovoltaiky, teplota prostředí, délka roku, riziko radiace.

### Capsule Arrival Event
Každá nová kapsle na orbitě = event v event-logu. Vláda kolonie ji musí posoudit (aktivně) nebo přijde timeout (auto-recyklace).

---

## Meta-layer

### World Browser
Mimoherní nástroj pro prohlížení **více beltů současně** (různé aktivní kolonie i historicky zaniklé). Zaniklé kolonie jsou přístupné jen jako archiv EventLogů — jejich historie žije dál, i když svět sám skončil (viz *Endings Spectrum* v SCENARIO sekce 6). Použití:

- Hráč v pre-game ghost experience (čekání na rozhodnutí).
- Historici / antropologové kolonií (meta-game).
- Srovnávání strategií mezi belty.

### Iteration (Iterace beltu)
Jeden běh Colony Arc (2.1 Founding → 2.7 Ending). Po *Reset* zakončení může vzniknout nová iterace se stejnou kolonií ve druhé generaci.

---

## Design Constants (TBD)

| Konstanta | Význam | Hodnota |
|---|---|---|
| `CONST_BELT_LENGTH` | Obvod prstence v cells | TBD (pro POC 500–2000) |
| `CONST_CELL_BASE_CAPACITY` | Počet staveb v cell bez upgradu | TBD |
| `CONST_CAPSULE_TIMEOUT` | Timeout pro rozhodnutí o kapsli | TBD (hodiny / 1–2 dny) |
| `CONST_RECYCLE_YIELD_ECHO` | Echo výnos z recyklace kapsle | TBD |
| `CONST_RECYCLE_YIELD_KREDO` | Kredo výnos z recyklace kapsle | TBD |

---

## Deprecated / Parkováno

- **Binární strom jako topologie** — nahrazeno prstencem. Parkováno v IDEAS.md.
- **Fork event / forks** — nahrazeno Belt Closure Event a Orbital Shift. Parkováno v IDEAS.md.
- **Rift** (třetí zdroj) — zrušeno po pivotu.
- **`CONST_FORK_LIMIT`** — zrušeno s forky.
- **Paid entry / real-money monetizace** — zrušeno v sezení 3. Viz SCENARIO sekce 11.
