# GLOSSARY.md — ⊙ Voidspan

Jediný zdroj pravdy pro klíčové pojmy projektu. Když se pojem mění, mění se zde. Ostatní dokumenty (IDEAS, TODO, SCENARIO, sessions, kód) se na tento glosář odvolávají.

Verze: **v0.5** (Sezení 12 — UI Layout axiom: Top Bar / Main Panel / Bottom Bar ukotvené, boční obsah jako Floating Panels Kolonisté / Úkoly / Události / Podrobnosti).

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
WORLD → BELT → SEGMENT → MODULE → BAY
```

### WORLD
Jeden server Voidspanu = jeden WORLD. Obsahuje jednu hvězdnou soustavu (**Teegarden System**). Hostí jeden nebo více beltů.

### BELT
Kolonijní prstenec na konkrétní oběžné dráze kolem hvězdy. Obvod = `CONST_BELT_LENGTH` segmentů (= **256**). Před uzavřením = lineární pás se dvěma konci, po uzavření = kruh bez konců. Sousední segmenty indexováno `(i-1) mod N` a `(i+1) mod N`.

**Belt Network (R1):** více beltů na různých orbitech jedné hvězdy. Adresování `Teegarden.BeltN.SegXXX…`. Naše startovní kolonie = **Belt1** (default). Objevení dalších beltů = `Observatory Event` (narativní spouštěč).

### SEGMENT
Jeden z `CONST_BELT_LENGTH` dílků beltu. Obsahuje grid **2×8 = 16 bays** (`CONST_SEGMENT_VOLUME`). Má horního a dolního souseda podél prstence. Stavy: `EMPTY → DEVELOPED → DECAYING → LOST`.

Segment je zároveň kontejner hráčova stavu — viz `Cell Binding Protocol` (název protokolu zachován; označuje fyzickou lokalizaci hráče do segmentu).

### MODULE
Funkční stavební celek v segmentu. Zabírá **1..N bays** v Tetris/Pentomino layoutu. Největší přípustný modul = celý `CONST_SEGMENT_VOLUME`. Typy modulů viz sekce *Module Types* níže.

**Module Specialization Principle:** integrované multi-purpose moduly (malé, 1×1) mají **minimální výkon a kapacitu**. Dedikované jednoúčelové stavby (velké, až celý segment, s personálem) jsou řádově výkonnější (příklad: 1 lůžko v MedCore vs. 1024 lůžek v plné Nemocnici). Upgrade curve = motivace specializovat se, jakmile kolonie dospěje.

### BAY
Atomická jednotka prostoru (1 políčko gridu segmentu). Jeden modul může zabírat víc tilů; jeden bay však vždy patří nejvýše jednomu modulu. Pro stavbu většího modulu je nutné **vybourat** potřebné bays.

### Adresa
`Teegarden.BeltN.SegXXX.MYY.TZ`  
Např. `Teegarden.Belt1.Seg042.M03.T5` = Teegarden System, belt 1, segment 42, modul 3, bay 5.

### Hub
**Flag** na segmentu (`segment.is_hub = true`), ne vlastní entita. Hub-segmenty jsou nedestruktibilní a hostí instituce (**Katastr**, **Soud**, **Banka**, **Šerif**, **Parlament** — postupně se odštěpují z `CommandPost`). Kolektivně vlastněné.

---

## Module Types (startovní a odvozené)

Startovní sada na palubě `SHIP` (viz SHIP konfigurace). Další moduly vznikají výzkumem a stavbou.

| Modul | Rozměr (typ.) | Role |
|---|---|---|
| **SolarArray** | 2×2 | Produkce energie W (napájí drony a moduly) |
| **Storage** | 2×2 a větší | Sklad Slab/Flux/Coin (materiály, kapaliny, měna), zásoby jídla |
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

Mateřská loď generačního typu, **zaparkovaná na orbitě Teegardenu**. Zabírá **jeden segment** (Belt1.Seg000). Celkem `CONST_SEGMENT_VOLUME = 16` bays. Startovní posádka `CONST_FOUNDING_CREW = 8` v kryospánku, probouzí se postupně podle příchozích pozvánek (viz `Founding Colonist Invitation`).

> Revize S6: Původní návrh S5 počítal se SHIP přes 2 segmenty, ale modulová math se vešla do jednoho (14/16 bays) s menšími moduly (1×1 místo 2×2). KISS + izomorfismus vítězí — **P1 i plný SHIP sdílí stejnou 1-segment konfiguraci**.

**SHIP (Seg000), 14/16 bays využito, 2 bays volno:**

| Modul | Rozměr | Bays | Stavy |
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
- **Příklad (A18):** demontáž Engine stojí **120 WD**. Při 4 Constructor (4×10) + 1 hráč (8) = 48W → **2,5 dne** hry. Výstup: +4 E (Energy), +80 ◎ (Coin), Dock slot odemčen.

**Napájení:** `SolarArray 2×2 = 48 W` (provisional, pokrývá přesně 4 Constructory + 1 hráče). Energetický limit omezuje počet simultánně aktivních aktorů — úvodní „max 4 drony" plyne z 1 SolarArray.

**Aktér v kryo = 0 W**, aktér spící v habitatu (schedule slot `Sleep`) = 0 W produkce, aktér hladový / HOMELESS ztrácí HP (viz níže).

---

## Capability Matrix (role a výkony)

Actor se v schedule slotu věnuje **jedné roli současně** (`Specializace`, KISS). W/WD platí pro Build/Haul. Ostatní role používají `CP` (Capability Points) — např. Guard 10 CP = jeden dron pokryje 10 CP-bays území, Heal 4 CP = rychlost léčení na lůžku.

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

## Resources — Model v0.1 (axiom, S12)

**5 ekonomických os:**

| Zdroj | Symbol | Typ | Obsah |
|---|---|---|---|
| **Energy** | `E` | rate + storage | elektřina v baterii; výroba (SolarArray) − spotřeba (moduly) |
| **Work** | `W` | throughput | pracovní kapacita = Σ `power_w` všech pracujících aktérů |
| **Slab** | `S` | solid stock | všechny pevné materiály (kov, komponenty, food, ...) |
| **Flux** | `F` | fluid + gas stock | kapaliny + plyny (voda, chlazení, **vzduch** včetně) |
| **Coin** | `◎` | currency | měna, ne materiál; směna, platby, mzdy |

**Food = subtyp Slab** (F3 architektura). HUD agreguje do 1 baru, event engine ví: `slab.food < 10` → trigger „hladomor". Pro P2+ lze přidat další subtypy (metal, components) bez změny HUD.

**Air fold do Flux:** POC_P1 §14 `air_drain` refactorováno na `flux_drain` (breach = unikající Flux, ne Air specificky).

**Kredo retirováno** — původní pojem z S1–S3 (currency + vague material). Nahrazeno jasným `Coin` (currency only) + `Slab` (materiál). `Echo` (capsule recycling) bude nově taky Coin payout.

---

### Axiom: formatScalar — jednotící zobrazení hodnot

Všechna čísla v UI (HUD, panely, tooltipy, log) procházejí **`formatScalar(value)`** helperem (`src/game/format.ts`). Jediný zdroj pravdy.

**Pravidla:**
1. **2 significant digits.**
2. **SI prefixy:** `µ` (10⁻⁶), `m` (10⁻³), `` (10⁰), `k` (10³), `M` (10⁶), `G` (10⁹), `T` (10¹²).
3. Prefix se volí tak, aby hodnota po škálování ležela v `[0.1, 1000)`.
4. Trailing zeros zachovány v rámci sig digits (`1.0k`, ne `1k`).

**Příklady:** `0` → `"0"` · `0.000045` → `"45µ"` · `0.0023` → `"2.3m"` · `0.15` → `"0.15"` · `12` → `"12"` · `450` → `"450"` · `1500` → `"1.5k"` · `999999` → `"1.0M"` · `45_000_000` → `"45M"`.

**`formatResource(current, max, unit)`** — helper pro „current/max X" formát (např. `"0.15/12 E"`).

---

## Resources (legacy — RETIRED, viz Resource Model v0.1 výše)

> **Echo** a **Kredo** jsou retirované pojmy z v0.0. Mapování:
> - **Echo → Energy (E)** — solární / pohon / provozní energie.
> - **Kredo → Coin (◎)** — univerzální měna (stavba, obchod, mzdy).
>
> Aktuální kánon: `Resource Model v0.1` (5 os: E / W / S / F / ◎). Starý dvouvýznamový model (E = hmota + peníze, jaký vycházel z „Kredo" jako stavební zdroj) byl v S12 rozdělen: materiály → **Slab (S)**, kapaliny/plyny → **Flux (F)**, měna → **Coin (◎)**. Recyklace kapslí (viz *Capsule*) je vedlejší zdroj Coin a Slab.

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

## UI Layout — panely

### Axiom: tooltipy všude, kde má význam
**Každý interaktivní nebo informativní prvek nese tooltip** (hover → drobný panel s textem). Důvod: odlehčit UI od permanentní nápovědy, nechat prostor pro obsah.

- **Delay:** 400 ms hover → show (žádný flicker).
- **Vzhled:** pozadí `UI_PANEL_BG` (`#0a0a10`) s 1px `UI_BORDER_DIM` rámečkem, text `UI_TEXT_PRIMARY` (amber bright), font VT323 velikosti `FONT_SIZE_HINT` (16 px).
- **Pozice:** pod kurzorem s 12px offsetem, auto-flip pokud přečnívá.
- **Max šířka:** 280 px, word-wrap.
- **Obsah:** řádek 1 = primární popis. Další řádky volitelně detaily / klávesové zkratky / hodnoty.

Implementace: `src/game/tooltip.ts` → `TooltipManager.attach(target, provider)`. Provider je funkce volaná při hover, vrací dynamický text (nebo `null` = nezobrazit).

### Axiom: kompaktní typografie
Grafické výstupy držíme **kompaktní — jediná mezera mezi prvky**. Žádné vícenásobné mezery, žádné oddělovače typu `|` nebo `·` pokud to sémantika nevyžaduje. Čitelnost drží monospace font (VT323) a řazení, ne whitespace padding.

**Herní čas:** formát `T:D.HH:MM` (bez mezer). `D` = herní den od založení (od 0), `HH:MM` = čas uvnitř herního dne (16 herních hodin, HH = 0–15). Příklad: `T:3.09:42` = 3. den, 9 hodin 42 minut herního času. **Sekundy se nezobrazují** — granularita tiku = 1 game minuta, `SS` by byl vždy `00`.

**Wall čas se nezobrazuje** — hráč vidí jen herní čas. Žádný server time, host time, real-world clock.

---

## UI Modes — Observer vs. Player (axiom, S15)

Hra má **dvě perspektivy** s oddělenými HUD rozsahy:

| Mode | Pohled | HUD obsah | Fáze |
|---|---|---|---|
| **Observer** | kolonie jako celek | `World.resources` agregované (E/W/S/F/◎) | **P1 scope** |
| **Player** | jeden aktér + jeho kontext | per-actor HP, osobní inventář (◎, food), pozice, action palette | P2+ |

**Princip:** Top Bar 5 resource bars je **Observer-only** — zobrazuje stav kolonie, ne hráče. Per-actor indikátory (HP, osobní zásoby) patří do floating panelu *Podrobnosti* [P] nebo *Kolonisté* [K] v Observer módu; v Player módu (P2+) migrují do Top Baru a kolonijní souhrny se přesunou do floating panelu.

**Izomorfismus:** stejné zdroje (◎, Slab.food, Flux.air, …) se v obou módech zobrazují v **Top Baru**, ale jiná škála — kolonijní vs. osobní. Pojmenování jednotek shodné.

**Mode switch** (P2+): patrně zoom-level přechod (mapa beltu → colony view = Observer → actor view = Player) nebo hotkey toggle. Finální UX TBD.

**P1 důsledek:** hráč v P1 nemá samostatné HP / osobní zásoby — sdílí osud kolonie (viz POC_P1 §Q-P1-Character).

---

## UI Layout (3 zóny + floating panely)

Rozložení obrazovky drží **tři ukotvené zóny** (top / main / bottom) + **plovoucí panely** otevírané na vyžádání. Cíl: Main Panel zabírá maximum plochy; vše ostatní se objeví jen když to hráč potřebuje.

### Horní panel (Top Bar / HUD)
Ukotvená horní lišta. Vždy viditelná. Obsah:
- **Vlevo:** `⊙Voidspan v1.0  <Adresa.pásu>  T <čas>` (branding + identita + lokace + herní čas)
- **Vpravo:** `[?] Help`

Zdroje (E / W / S (food) / F (air) / ◎ — Resource Model v0.1) jsou zatím ve floating panelu *Zdroje*. Pokud se v ladění ukáže, že stavová viditelnost trpí (hráč mine hladovění), přesunou se sem mezi čas a Help.

### Hlavní panel (Main Panel)
Ukotvená střední plocha. Primární hrací prostor — segment grid 8×2, orbitální dekor, interakce (klik bay = task, klik modul = inspekce). Full-width mezi Top a Bottom Bar.

### Dolní panel (Bottom Bar / Event Log ticker)
Ukotvená dolní lišta. Vždy viditelná. Kompaktní ticker posledních 3–5 událostí. Pro plnou filtrovatelnou historii → floating panel *Události*.

### Plovoucí panely (Floating Panels)
**Neukotvené.** Otevírají se toggle (hotkey nebo button v Top Baru), překrývají Main. Druhé stisknutí téže klávesy = zavřít. `Esc` = zavřít všechny.

| CZ název | EN název | Hotkey | Obsah |
|---|---|---|---|
| **Kolonisté** | Colonists | `K` | Seznam aktérů (hráč + drony). Kind, power_w, state, current task. Klik → highlight tasku a actor path. |
| **Úkoly** | Tasks | `U` | Task queue. Drag&drop priority, progress bar, assigned actors, cancel. (P2+: filtr podle kind / status.) |
| **Události** | Events | `E` | Plný filtrovatelný Event Log. Historie, search, filtr podle type/severity. Rozšíření Bottom Bar tickeru. |
| **Podrobnosti** | Details (Inspector) | `P` / `Tab` | Kontextový inspector vybraného objektu (bay / modul / actor / task). Kontext určuje obsah. |
| **Zdroje** | Resources | `Z` | E / W / S (food) / F (air) / ◎ s historií (mini-sparkline) — Resource Model v0.1. Kandidát na přesun do Top Baru, pokud always-visibility bude nutná. |

**Princip:** žádné trvale ukotvené sidebary. Main Panel není krájený na sloupce. Plovoucí panely jsou **dočasné nástroje**, ne fixní HUD.

**Seam pro rozšíření (P2+):** nové panely (Diplomacie, Výzkum, Trh…) přibudou jako další Floating Panels bez změny layout architektury.

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
| `CONST_SEGMENT_VOLUME` | Bays v segmentu (grid 2×8) | **16** |
| `CONST_HABITAT_CAPACITY` | Lidí v 1×1 Habitatu | **8** |
| `CONST_FOUNDING_CREW` | Zakládající posádka v kryo | **8** |
| `CONST_DAY_HOURS` | Herních hodin v herním dni | **16** |
| `CONST_TIME_COMPRESSION` | Poměr wall-clock / herní čas | **~16×** (nezávazně) |
| `CONST_MARSHAL_BASELINE` | Baseline Marshals pro lawlessness=0 | **4** |
| `CONST_HOMELESS_HP_DRAIN` | HP ztráta bezdomovce / herní hod | **1** (provisional) |
| `CONST_CAPSULE_TIMEOUT` | Timeout rozhodnutí o kapsli | TBD (hodiny / 1–2 dny) |
| `CONST_RECYCLE_YIELD_ENERGY` | Energy (E) výnos z recyklace kapsle | TBD |
| `CONST_RECYCLE_YIELD_COIN` | Coin (◎) výnos z recyklace kapsle | TBD |
| `CONST_DECAY_DEV_TO_DECAYING` | Trvání fáze DEVELOPED bez údržby | TBD (3–7 dní?) |
| `SHIP_SOLARARRAY_POWER` | W jedné SolarArray 1×1 | TBD (S5 hodnota 48 W platila pro 2×2, re-derive pro 1×1) |
| `CONST_PUZZLE_SLACK_FACTOR` | Timeout / budget = `factor × optimum` v puzzle módu | **2** |

---

## Deprecated / Parkováno

- **`Cell` jako entita** (S5) — nahrazeno hierarchií SEGMENT/MODULE/BAY. Dříve používaný pojem „Cell" = **segment**. Parkováno; v kódu nepoužívat.
- **SHIP přes 2 segmenty** (S5) — revidováno v S6 na 1 segment. SHIP-Bow / SHIP-Stern naming retired.
- **Binární strom jako topologie** — nahrazeno prstencem. Parkováno v IDEAS.md.
- **Fork event / forks** — nahrazeno Belt Closure Event a Orbital Shift. Parkováno v IDEAS.md.
- **Rift** (třetí zdroj) — zrušeno po pivotu.
- **`CONST_FORK_LIMIT`** — zrušeno s forky.
- **Paid entry / real-money monetizace** — zrušeno v sezení 3.
