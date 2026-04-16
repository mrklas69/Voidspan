# GLOSSARY.md — ⊙ Voidspan

Jediný zdroj pravdy pro klíčové pojmy projektu. Když se pojem mění, mění se zde. Ostatní dokumenty (IDEAS, TODO, SCENARIO, sessions, kód) se na tento glosář odvolávají.

Verze: **v1.4** (Sezení 25 — **Food + Air retire (KISS)**: `solids.food` smazáno (food je atribut item, ne kategorie); `fluids.air` smazáno (24th-cent recyklace, atmosféra není gameplay osa). FVP subtypy: Solids = {metal, components}, Fluids = {water, coolant}. Per-capita drain prázdný stub. ActorLifeTick HP drain z deficitu odstraněn. **Resource Taxonomy** (rarity 5 stupňů: Common/Uncommon/Rare/Exclusive/Epic + logistics matrix Solids/Fluids — design baseline pro P2+ ekonomiku, FVP scope drží generické placeholder subtypy). **Recipes**: každý Modul/Bay má `ResourceRecipe` per-HP rate, repair drénuje per recipe (M:N reference). **Top Bar S/F bary** ukazují worst-of subtypů. **QM material gate** se subtype-specific důvodem (`Paused — no metal`/`no components`/...). **Kvintet renaming**: 3. = `Pevné/Solids (S)`, 4. = `Tekutiny/Fluids (F)` (`Slab`/`Flux` retirováno). **Drony spotřebovávají E** (productionTick odečítá 1 W/dron při productive tasku, feedback loop → QuarterMaster pause na E<40% / resume na E≥60%, 20% hystereze). **Dashboard 5-color kánon** (Top Bar bary sdílí barvu s tooltip headery přes `ratingColor(pct)`). **Software třída** s příkonem (QuarterMaster v2.3 draw_w 0.86 W). **Per-capita drain** (awake aktéři spotřebovávají Solids/Fluids). Sezení 24 — **QuarterMaster v2.3** (runtime Protokolu): auto-repair orchestrace, eternal monitor task, 5-color Task Queue Panel [T], task lifecycle (pending→active→paused→completed), autoclean po 1 h wall. **Responsive Layout axiom (KISS)**: canvas = viewport, všechny UI velikosti fix, text 18 px. **Protocol** kanonizován. Integrita (II.2) oddělena od E.).

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

## Simulation Axioms (S20)

### Colony Goal (axiom)

**Jediný GOAL hry/simulace:** trvale udržitelný život a rozvoj člověka.

**Směrový kompas:** hodně živých (a později šťastných) lidí s dobrou perspektivou.

Goal **≠ win condition** — je to **kompas** (směr), ne cílová čára (stav). Simulace konverguje k různě kvalitním projekcím téhož goalu; `Endings Spectrum` (Colony Arc) = různé stopy po cestě, nikoli finál.

### Perpetual Observer Simulation (axiom)

Svět žije nepřetržitě — bez hráčů, bez NPC, i když všechny entity mají HP=0. Přidání hráče je **resume**, ne restart. Simulaci ukončí **jen vypnutí serveru**, nikdy herní událost.

- Žádný `Phase.win` / `Phase.loss` jako terminální stav světa.
- `air = 0` neznamená konec simulace; znamená že aktéři ztrácejí HP (dusí se).
- `populace = 0` neznamená konec; kapsle z orbitu může přivést nové kolonisty do rozbité základny.

### Two Perspectives (axiom)

Dvě perspektivy téže simulace — **oddělené axiomy, oddělené modely**:

| Perspektiva | GAME_OVER | Scope |
|---|---|---|
| **Observer** | **neexistuje** | vidí svět, nemůže intervenovat. FVP default. |
| **Player** | ANO — per hráč | vtělení do aktéra, P2+. |

WIN/LOSS puzzle v P1 POC (SHIP Wake-up s HULL BREACH → ENGINE→DOCK → BONUS) byl **onboarding test**, ne kánon simulace — bude retirován.

### Maslow axiom

Osy Status tree (I–IV) jsou **nezávislé dimenze** — kolonie má hodnotu na každé zvlášť.

Ale **strategie investic je hierarchická:** vrstvu N lze efektivně budovat jen na **pevné N-1**. Inspirace: Maslowova pyramida potřeb. Operacionalizace: nenavrhuje se cesta „skočit rovnou do Rozvoje" (III), dokud Udržitelnost (II) není v zelené. Brains (P2+) respektují hierarchii.

### FVP — First Viable Product

Minimální **observable simulation sandbox**, který ukážeme playtestrům P1–P4. Není to P1 POC (ten byl puzzle s WIN/LOSS). FVP = perpetual observer svět bez hráčů, s automatikou dronů, výroby, obchodu; NPC přidat později, živí hráči úplně naposledy.

**FVP scope pro Status tree:** I.1 kvantita, I.2 kvantita+kvalita, II.1, II.2. Zbytek (III, IV, kvalita I.1) = placeholdery / „Bla bla" stubs, all-green v UI.

---

## Protocol — AI CPU + Knowledge Base kolonie (S24)

Centrální řídicí vrstva základny. **Ne „chytrá domácnost pásu"** — jediný zdroj pravdy pro vše, co kolonie **ví, řídí a věří**. Běží nepřetržitě (P2+: i bez hráčů, v souladu s Perpetual Observer axiom).

### Vrstvy knowledge base

| Vrstva | Role | Dynamika změn |
|---|---|---|
| **Bible** | hodnoty, morální kodex, narativní tenety | quasi-fixní, změna vyžaduje kolektivní krizi |
| **Ústava** | fundamentální pravidla kolonie (občanství, hierarchie, volby) | ústavní akt Parlamentu |
| **Zákoník** | právo, skutkové podstaty, sankce, tresty | zákonodárný proces |
| **Vyhlášky** | lokální / krizová pravidla, výjimky | správní rada / šerif (rychlé) |
| **Plány** | strategické a taktické cíle kolonie | hlasování nebo brains konsensus |
| **Recepty** | build blueprints, crafting formule, module design | game-internal, rostou výzkumem |
| **Návody** | procedurální know-how (jak opravit SolarArray, jak evakuovat segment) | game-internal, rostou výzkumem |
| **Příručka** | uživatelská dokumentace základny pro nové kolonisty | generovaná + editovatelná (role Archivář) |

### CPU funkce (Protocol jako runtime)

Protokol běží jako **kolonijní AI proces** (ne per-hráč). Nemá vlastní stav entity, je to **pravidlový engine nad World modelem**. Rozhoduje o:

- Routing úkolů dronům (který dron na který task).
- Údržbě (kdy triggerovat repair task — v souladu s platnými Vyhláškami o prahu HP).
- Bezpečnostních reakcích (lockdown, evakuace).
- Schvalování capsule arrivals (dle Ústavy a Vyhlášek o citizenship).
- Ekonomických pravidlech (mýto, daně, odměny — dle Zákoníku).

### Software (S25) — instalované runtime systémy

Každý autopilot/ovladač/manager kolonie je **Software instance** s těmito atributy:

| Atribut | Popis |
|---|---|
| `id` | stabilní identifikátor (`quartermaster`, `lifesupport`, …) |
| `name` | čitelný název („QuarterMaster") |
| `version` | verze runtime (upgrade přes výzkum) |
| `draw_w` | **příkon** v W — kontinuální odběr, běží-li SW |
| `status` | `running` \| `offline` — offline při E=0 |

**Příkon jako U moduly:** SW běží na CPU, CPU potřebuje E. Odběr je **kontinuální** (bez ohledu na aktuální aktivitu) a liší se per verze. Nová verze = víc schopností, obvykle i vyšší spotřeba (v4.x Energy-aware naopak úspornější).

**Energy gate:** `productionTick` odečítá `Σ draw_w` běžících SW od `netPower`. Při E=0 všechny SW přechází `offline` + DRN:CRIT event per SW. Po obnovení E (≥ 1 Wh) bootují zpět → BOOT event.

**V FVP běží jeden SW:** QuarterMaster v2.3, `draw_w = 0.86 W` (`QM_DRAW_W` v `tuning.ts`).

### QuarterMaster — runtime Protokolu (S24)

Konkrétní implementace Protokolu ve FVP. **Verzovaný SW** (viz Software výše) — upgrade přes výzkum odemyká nové capabilities (IDEAS parkoviště).

**Startovní verze:** `v2.3` (předchozí iterace kolonií už vylepšily), `draw_w = 0.86 W`. Konstanta `PROTOCOL_VERSION` v `tuning.ts`.

**FVP capabilities (v2.3):**
- Auto-repair orchestrace se čtyřmi gate podmínkami (všechny musí být ready pro RESUME, kterákoliv pauzuje):
  1. **Energy** — rating ≥ 4 (≥ 60 %) pro resume, ≤ 2 (< 40 %) pro pause. Hystereze 40–60 %.
  2. **Workers** — alespoň jeden drone online (drone > 0 && E > 0) nebo alive aktér s HP > 0.
  3. **Autopilot online** — QM SW není offline (E=0 vypne CPU → žádné orchestrace).
  4. **Material** — `solids.food > 0` (repair drénuje Solids, S25). Pauza při 0, resume jakmile > 0.
- W rating do gate **nevstupuje** (S24 Censure fix — W rating odráží availability, použití by zacyklilo).
- `isProductiveTask(t)` = `status === "active" && kind !== "service"` (sdílený predikát pro sim `productionTick` + tooltipy).
- Target selection: nejnižší HP ratio (bay nebo modul).
- Eternal monitor task — label reflektuje stav (priorita shora dolů): `OFFLINE — no power` / `Paused — low Energy` / `Paused — no workers` / `Paused — no Solids` / `Idle — nothing to repair` / `Standby` / `Active`.

**Repair economy (S25) — per-target recipes:**
- Každý tick repair tasku: `recipeDrain = ResourceRecipe × hp_delta` z příslušných subtypů Solids/Fluids.
- Recipe = M:N reference Module/Bay → subtypy (definováno v `MODULE_DEFS[*].recipe` / `BAY_DEFS[*].recipe`, model.ts).
- Při deficitu **kterékoli složky** receptu (recipe[subtype] × ε > available) → tick skip + next protocolTick pauza s důvodem `no <subtype>` (např. `Paused — no metal`).
- Nulový přísun (P2+ Greenhouse / mining produkce). Hráč musí restockovat.

### Recipe tabulka (FVP seed, per-HP rate)

Total build cost = recipe × HP_MAX. Per-tick repair drain = recipe × hp_delta.

**S26 FVP KISS:** recepty cílí pouze dvě ploché kategorie — `solids` a `fluids` (žádné subtypy).

| Item | solids | fluids |
|---|---|---|
| Bay skeleton | 0.050 | — |
| Bay covered | 0.065 | — |
| SolarArray | 0.080 | — |
| Storage | 0.055 | — |
| Habitat | 0.080 | 0.02 |
| MedCore | 0.100 | 0.06 |
| Assembler | 0.110 | 0.02 |
| CommandPost | 0.110 | — |
| Dock | 0.120 | — |
| Engine | 0.170 | 0.05 |

Subtypy (metal/components/water/coolant) odloženy na P2+ — viz TODO „Resource subtypes".

**Task lifecycle (S24):**
```
pending → active → (gated) → paused → (ready) → active → completed
                                                         ↘ failed
eternal                                    (service task, nedokončí se)
```
- Autoclean: `completed` / `failed` starší než `TASK_AUTOCLEAN_TICKS` (1 h wall) → evict.

**Planned upgrade path (IDEAS):**
- v3.x — **Integrovaná obrana** (Combat drones, asteroid/pirát response).
- v4.x — **Energy-aware balancing** (predictive load management).
- v5.x — **Multi-colony coordination** (Belt Network R1).

### Vztahy k ostatním konceptům

- **vs. `brains` (per hráč, IDEAS):** brains jsou **osobní proxy** hráče, **čtou Protokol** a vykonávají v jeho mantinelech. Protokol > brains. Brains nemůže porušit Zákoník bez konsekvence.
- **vs. Marshals (drony násilí):** T2 napětí („drones ≠ players") = **Protokol nesmí iniciovat ofenzivní akci**. Defenzivní/údržbová OK, ofenziva jen na autorizaci hráče (šerif, parlament).
- **vs. Parlament / Soud / Šerif:** tyto instituce **mění Protokol** (ústavní / zákonodárný / vyhláškový akt). Protokol je výstup, instituce jsou input-proces.
- **vs. Status tree:** Status = jak je kolonie **na tom** (metriky). Protokol = jak kolonie **funguje** (pravidla). Příčina vs. důsledek.
- **vs. Event Log:** každá změna Protokolu = **EVNT** event. Log je **audit trail Protokolu**.

### Otevřené otázky (k rozpracování)

- **Q-Protocol-Genesis:** kdo píše startovní Protokol? Autor hry (hardcoded bootstrap Bible + Ústava) + kolonie doplňuje zbytek v průběhu?
- **Q-Protocol-Mutation:** formální proces změny per vrstva (Bible × Vyhláška mají řádově jinou bariéru). Ceremoniál ústavního aktu?
- **Q-Protocol-Scope:** Protokol per belt, per kolonie, nebo per WORLD? Belt Network (R1) = víc Protokolů v pnutí?
- **Q-Protocol-Conflict:** co když se Bible a Vyhláška protiřečí? Lexikální ordering (Bible > Ústava > Zákoník > Vyhlášky)? Kdo arbitruje?
- **Q-Protocol-UI:** jak hráč Protokol **čte a mění** — terminál? dokumentové view (wiki-styl)? konverzace (LLM)?
- **Q-Protocol-Corruption:** může být Protokol napaden/pozměněn (sabotáž, virus, trojský kůň)? Security model?
- **Q-Protocol-LLM:** jsou Recepty/Návody/Příručka **LLM-generované** (emergent), nebo hand-authored katalog (fixed)? (Napojeno na „Procedural Layer" v SCENARIO §8.)
- **Q-Protocol-Naming-Collision:** slovo „protokol" v existujících pojmech (`Cell Binding Protocol`, `Hail Mary` „neformální protokol kapslové žádosti") = jiný význam (procedura). Přejmenovat na něco jako `Cell Binding` / `Hail Mary Flow`, nebo ponechat s disclaimerem?

---

## Status — Strom zdraví kolonie

Fraktální strom ukazatelů zdraví kolonie. **Stav kolonie = posádka + základna.** Synonyma (Posádka/Kolonisté/Crew) se neřeší — alias.

### Struktura

```
Status
 ├── I. Aktuální stav
 │   ├── I.1 Posádka  (kvantita + kvalita)
 │   └── I.2 Základna (kvantita + kvalita)
 ├── II. Udržitelnost (vyhlídky — přežití)
 │   ├── II.1 Zásoby kolonistů (vzduch, voda, jídlo — runway + trend)
 │   └── II.2 Integrita základny (S24 — přejmenováno z „Entropie"; FVP = snapshot avg HP vrstev, target = rate repair vs. decay)
 ├── III. Rozvoj (vyhlídky — expanze)        [P2+ pahýl]
 │        migrace, rozmnožování, pás, expedice
 └── IV. Společnost                            [P2+ pahýl]
          důvěra, politická stabilita, koheze
```

### Agregace

**Parent = worst child** (fraktální semafor). Status root barva = nejhorší listová metrika. Kompozice rekurzivní na všech úrovních.

Barevný kánon (S25): UI ukazatel s barvou čerpá barvu ze stejné metriky přes 5-color `RATING_COLOR[statusRating(pct)]` v `palette.ts` — stejná mapa pro Top Bar bary, tooltip headery, InfoPanel rating, Event Log SIGN. Pět kbelíků: < 15 % red, < 40 % orange, < 60 % amber, < 80 % cyan, ≥ 80 % green.

Interní 3-state `StatusNode.level` (ok/warn/crit) se používá jen pro agregace ve world.ts (`toLevel` přes `THRESHOLD_CRIT_PCT = 15`, `THRESHOLD_WARN_PCT = 40`), ne pro barvení UI.

### Metriky per uzel (FVP seedy, laditelné)

- **I.1 kvantita:** počet živých aktérů / Habitat kapacita. Kritické < 25 %.
- **I.1 kvalita:** ∑HP aktérů / ∑HP_MAX (FVP pahýl; P2+ happiness/stress/health).
- **I.2 kvantita:** osazené bays / 16 (ratio non-void).
- **I.2 kvalita:** ∑HP všech vrstev / ∑HP_MAX_THEORETICAL.
- **II.1:** `min(food_days, air_days, water_days)` do 0 při current drain rate.
- **II.2 (Integrita):** **FVP seed** = snapshot avg HP všech vrstev (bays + moduly) — jednoduché a čitelné. **Target (TODO):** net HP trajectory per game-day (repair rate − decay rate). Energie se **nemíchá** — má vlastní osu (E bar v HUD).
- **III, IV:** FVP placeholder all-green, „bla bla" text.

### Jednoslovné hodnocení stavu pásu (S21)

| Úroveň | Čeština | Angličtina | Rozsah |
|---|---|---|---|
| 5 | Vynikající | Excellent | 80–100 % |
| 4 | Dobrá | Good | 60–80 % |
| 3 | Dostačující | Fair | 40–60 % |
| 2 | Slabá | Poor | 15–40 % |
| 1 | Selhání | Failure | 0–15 % |

Mapování na UI barvu: **5-color rating** (viz Agregace výše, S25) — 5 green / 4 cyan / 3 amber / 2 orange / 1 red. Interní 3-state `StatusNode.level` (ok/warn/crit přes `THRESHOLD_CRIT_PCT = 15`, `THRESHOLD_WARN_PCT = 40`) se používá jen pro agregační logiku ve world.ts, ne pro barvení UI.

Detail metrik (konkrétní formule, kalibrace) — viz otevřené otázky v `IDEAS.md` („Status tree Q2–Q10").

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
| **Storage** | 2×2 a větší | Sklad Solids/Fluids/Coin (materiály, tekutiny, měna), zásoby jídla |
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

**5 ekonomických os (Kvintet):**

| Zdroj (CZ) | Zdroj (EN) | Symbol | Typ | Obsah |
|---|---|---|---|---|
| **Energie** | **Energy** | `E` | rate + storage | elektřina v baterii; výroba (SolarArray) − spotřeba (moduly + drony + SW) |
| **Práce** | **Work** | `W` | throughput | pracovní kapacita = Σ `power_w` všech pracujících aktérů + dronů |
| **Pevné** | **Solids** | `S` | solid stock | pevné a sypké látky (jídlo, kov, komponenty, …) |
| **Tekutiny** | **Fluids** | `F` | fluid + gas stock | kapaliny, plyny, plazma (vzduch, voda, chladivo, …) |
| **Kredit** | **Coin** | `◎` | currency | měna, ne materiál; směna, platby, mzdy |

**Skupenství axiom (S25):** 3. a 4. kategorie pokrývají **dvě fyzikální skupenství** zdrojových surovin (paralela ve dvou osách): `Pevné/Solids` (solid + granular) vs. `Tekutiny/Fluids` (gas + liquid + plasma). Gramatická paralela: oba plurály neutra.

**FVP scope (S26 KISS):** pouze dvě ploché suroviny — `solids` a `fluids`. Bez subtypů. Recepty Modulů/Polí cílí pouze S a F per-HP rate.

**Subtypy (P2+):** metal/components (Solids), water/coolant (Fluids) — odloženo na ekonomickou fázi spolu s item registrem a rarity tiers. HUD struktura (S/F bary) zůstane stejná, subtypy se přidají do tooltipů a do receptů.

**Retirované pojmy:**
- `Slab` → **Solids** (S25 — Slab evokoval „ingot/blok kovu", neodpovídal subtypu food)
- `Flux` → **Fluids** (S25 — držet stavovou paralelu se Solids)
- `Kredo` → **Coin** (currency, S1–S3 retirement)
- `Echo` → **Energy** (capsule recycling = Coin payout, S1–S3)
- `solids.food` (S25 KISS) — food je atribut item, ne kategorie. Až přijde item registr s `edible` flagem, „food" = sum všech edibles. V FVP nikdo nejí (cryo crew).
- `fluids.air` (S25 KISS) — 24th-cent skafandry mají 100% recyklaci, atmosféra mimo skafandr není gameplay osa. Hull integrity covered HP modulů.

---

## Resource Taxonomy — Rarity & Logistics (S25 design prep, P2+ scope)

Členění Solids/Fluids do **rarity tierů** (5 stupňů) a **logistických tříd** (doprava + skladování + metrika). Designový baseline pro P2+ ekonomiku — kapsle, market, recyklace, dopravní moduly.

### Rarity tiers (5 stupňů)

| Rarity (CZ / EN) | Solids (Pevné) — příklady | Fluids (Tekutiny) — příklady |
|---|---|---|
| **Obyčejné** / Common | Kámen, Písek, Hlína | Voda, Surová ropa |
| **Neobvyklé** / Uncommon | Železo, Měď, Uhlí | Zemní plyn, Mazivo |
| **Vzácné** / Rare | Zlato, Uran, Titan | Kyseliny, Palivo |
| **Exkluzivní** / Exclusive | Diamanty, Izotopy | Tekutý dusík, Plazma |
| **Epické / Unikátní** / Epic, Unique | Nanomateriály, Artefakty | Temná hmota, Exolátky |

Rarity ovlivňuje (P2+):
- **Drop chance** kapslí (capsule recycling — vzácnější items vzácněji)
- **Market cenu** (commodities exchange — Common = nízká, Epic = enormní volatilita)
- **Recipe** vyšších modulů (Engine v3 vyžaduje Titan, Reactor vyžaduje Uran, …)
- **Recyklace výtěžek** — Common rozložitelné, Epic neodbouratelné (story-grade)

### Logistics matrix

| Kategorie | Doprava (Logistics) | Skladování (Storage) | Metrika |
|---|---|---|---|
| **Solids** (Pevné) | Dopravní pásy, pytle | Haldy, sila, bedny | kg / t |
| **Fluids** (Tekutiny) | Potrubí, hadice | Nádrže, barely | l / m³ |

Implikuje (P2+):
- **Dedikované dopravní moduly:** Conveyor (solids only), Pipeline (fluids only). Mixed kapsle = oba.
- **Storage typy:** Silo (solids bulk), Tank (fluids), Crate (small batch / mixed). Současný `Storage` modul = generic, P2+ rozdělit.
- **Metrika v UI:** kg/t pro Solids, l/m³ pro Fluids — `formatScalar` rozšířit o jednotky?

### FVP → P2+ rozštěpení

FVP drží **dvě ploché suroviny** (`solids`, `fluids`) — absolutní minimum pro recepty a material gate. P2+ rozštěpí na konkrétní items s `edible`/`rarity`/`unit` attributy.

Historický návrh subtypů (před S26 KISS, zůstává jako designová rezerva):

| Subtyp (P2+ kandidát) | Rarity bucket | Příklady ze taxonomie |
|---|---|---|
| `solids.metal` | Uncommon | Železo, Měď, Uhlí |
| `solids.components` | Rare | Elektronika, slitiny (Titan-bázované) |
| `fluids.water` | Common | H₂O, hydratační média |
| `fluids.coolant` | Uncommon | Mazivo, glykol, kryogenní směsi |

**Food = attribute, ne kategorie (S25 design insight):**

Edibility je **atribut item**, ne discrete subtyp. Napříč Solids i Fluids: energetická šťáva (Fluid: sirupy/koncentráty) je jedlá, pečivo (Solid) je jedlé, syntetické proteiny (Solid) jsou jedlé. P2+ item registr: každý item má `edible: boolean`. Per-capita drain spotřebovává „edibles pool" = sum všech edible items napříč subtypy. V FVP **nikdo nejí** (cryo crew, „lidé spí ještě stovku našich sezení").

**Vzduch retirován (S25 KISS):** v narrative 24. století mají skafandry 100% recyklaci, atmosféra mimo skafandr není gameplay osa. Hull integrity covered HP modulů (Habitat, segment bays). Indoor atmosphere quality = funkce Habitat/MedCore HP, ne separátní float.

### FVP scope

V FVP **rarity tiers ani logistics nehrají roli**. Všechny subtypy stejně dostupné, bez dopravních modulů, bez market cen. Generic placeholdery udrží recept-systém funkční. Plný vývoj přijde s P2+ ekonomikou (kapsle, market, doprava).

### TODO (P2+ rozpracování)

- **Rarity vrstvení:** kapsle drop tabulky, market cena per rarity tier
- **Conveyor / Pipeline moduly:** transport mezi Storage a konzumentem
- **Storage subtypy:** Silo (solids), Tank (fluids), Crate (small)
- **Recipe rozšíření:** vyšší moduly vyžadují konkrétní items (Titan, Uran, Coolant grade)
- **Item registr:** každý item má `{ name_cs, name_en, rarity, category (solids/fluids), unit (kg/t/l/m3) }`

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
> Aktuální kánon: `Resource Model v0.1` (5 os: E / W / S / F / ◎). Starý dvouvýznamový model (E = hmota + peníze, jaký vycházel z „Kredo" jako stavební zdroj) byl v S12 rozdělen: pevné a sypké → **Pevné/Solids (S)**, kapaliny/plyny → **Tekutiny/Fluids (F)**, měna → **Kredit/Coin (◎)**. S25 zpřesnění: ČJ pojmy „Pevné" a „Tekutiny" drží paralelu skupenství (`Slab`/`Flux` byla anglicky-only nálepka). Recyklace kapslí (viz *Capsule*) je vedlejší zdroj Coin a Solids.

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

## Events — dvě vrstvy

Ve Voidspanu existují **dvě odlišné vrstvy events**:

1. **Narativní events** (níže: Belt Closure, Orbital Shift, Capsule Arrival, Observatory) — **scripted** narativní spouštěče z `SCENARIO §5`. Mají trigger (podmínka ve světě), narativní text, rozhodovací body.
2. **Event Log (telemetrie, S20)** — **strukturovaný proud** všech událostí simulace (deaths, repairs, decays, builds, arrivals…). Oddělená infrastruktura, viz dále.

### Belt Closure Event
Dokončení prstence (spojení posledního segmentu s hubem). Historická událost řádu ~10M v event logu. Ceremonie, jednorázové v rámci iterace beltu.

### Orbital Shift
Kolektivně rozhodnuté povýšení / snížení orbitu beltu. Globální dopad: Echo, teplota, délka roku, radiace. V Belt Network (R1) = pohyb beltu mezi vertikálními vrstvami.

### Capsule Arrival Event
Každá nová kapsle na orbitě = event. Vláda kolonie ji musí posoudit (aktivně) nebo přijde timeout (auto-recyklace).

### Observatory Event
**První detekce jiného beltu** v soustavě. Narativní spouštěč přechodu z izolace (Belt1 solo) na R1 Belt Network. *„Naše observatoř zaznamenala novou mateřskou loď na orbitě… Nejsme sami."* Probíhá přes `CommandPost.Observatory` (integrovaná), později dedikovaný Observatory modul.

---

## Event Log System (S20)

Strukturovaný proud všech událostí simulace. **Telemetrie + UI čtivý ticker**, ne narativní scripted events. Inspirace: PocketStory Events systém (verb+consequence taxonomie, severity barvy, ring buffer).

**Model-first axiom:** event log žije v `World.events: Event[]` (jediný zdroj pravdy). UI (Event Log Card) je projekce. Umožňuje serializaci / persistence P2+ (MINDMAP §5.3 — 10M event stream jako experimentální data).

### Datový model

```ts
type Event = {
  tick: number;                           // herní tick (log entry timestamp)
  verb: EventVerb;                        // 4znakový tag akce
  csq?: EventCsq;                         // consequence: OK / FAIL / CRIT / START / PARTIAL
  loc?: string;                           // bay idx, module id, segment label
  actor?: string;                         // actor id
  item?: string;                          // module kind, resource type
  amount?: number;
  target?: string;
  text?: string;                          // volitelný narativní text
  severity: "crit" | "warn" | "pos" | "neutral"; // derived z verb×csq
};
```

**Severity je odvozená**, ne uložená — pure lookup `verb×csq → severity` v jednom zdroji pravdy. UI renderer jen čte.

### Verb Catalog (FVP seed)

Čtyřznakové (monospace rytmus). Unicode ikona + význam.

| Verb | Icon | Význam |
|---|---|---|
| `BOOT` | `◉` | start simulace |
| `SPWN` | `+` | spawn (kolonista, modul, kapsle) |
| `DEAD` | `†` | aktér umřel (state=dead) |
| `ARRV` | `↓` | landing / dokování |
| `DPRT` | `↑` | odlet |
| `REPR` | `✓` | repair task (complete nebo start) |
| `BLD ` | `▲` | build task |
| `DEMO` | `▽` | demolish |
| `DMG ` | `×` | damage event (HP drop) |
| `DECY` | `↘` | decay (entropie HP drain bez útoku) |
| `DRN ` | `−` | resource drain (air / food / water) |
| `PROD` | `*` | produkce (solar E, Greenhouse food) |
| `HAUL` | `→` | transport materiálu |
| `ASSN` | `»` | task assigned |
| `CMPL` | `✓✓` | task completed |
| `FAIL` | `!` | task failed |
| `IDLE` | `·` | aktér idle |
| `WAKE` | `☆` | aktér probuzen |
| `DOCK` | `⊙` | dock event |
| `TICK` | `·` | rytmický marker (default filtered off) |
| `STAT` | `§` | Status tree threshold crossed |
| `EVNT` | `◆` | scripted narativní event (SCENARIO §5) |
| `SAY ` | `"` | dialog (P2+ chat) |
| `RPRT` | `»»` | systémová zpráva |
| `TASK` | `◈` | změna stavu úkolu (S24 — START / PAUSE / RESUME / FAIL) |

### Consequence

`OK` (success) · `FAIL` · `PARTIAL` · `CRIT` (critical) · `START` (pro multi-tick tasky) · `PAUSE` / `RESUME` (S24, TASK transitions).

Klíč filteru + dataset = `verb:csq` (např. `REPR:OK`, `DMG:CRIT`, `TASK:PAUSE`). Jen `verb` = wildcard přes všechny csq.

### Severity — barva

| Severity | Paleta token | Vzor případů |
|---|---|---|
| `crit` | `UI_STATUS_ALERT` (red) | `DEAD:*`, `DMG:CRIT`, `DRN:CRIT`, `FAIL:*` |
| `warn` | `UI_STATUS_WARN` (amber) | `DECY:*`, `DMG:*`, `DRN:*` |
| `pos`  | `UI_STATUS_OK` (green) | `REPR:OK`, `BLD:OK`, `CMPL:OK`, `PROD:OK`, `WAKE:*`, `TASK:START`, `TASK:RESUME` |
| `warn` | `UI_STATUS_WARN` (amber) | `TASK:PAUSE` (S24) |
| `neutral` | `UI_TEXT_DIM` (amber dim) | `TICK`, `IDLE`, `ASSN`, `HAUL`, `MOV`, `RPRT:*` |

Mapping je pure function (`severity(verb, csq)`) — žádný switch rozesetý po UI.

### Ring buffer

**Kapacita: 500 events** (S20 decision). Push přes `appendEventLog`, přetečení = shift nejstarší. Žádný disk persist v FVP (P2+ přijde).

### Filter chips (UX)

**Lazy emergence axiom (S20):** filter chip pro daný verb se objeví **až při prvním výskytu** toho druhu eventu v aktuálním sezení. UI není přeplněné 23 čipy od startu; roste postupně, jak simulace generuje skutečnost.

Toggle visibility per verb. `TICK` defaultně off (jinak zaplácne log). Plná historie zůstává v bufferu, jen se skrývá render.

### UI — Event Log Card (layer 3.5 floating)

Hotkey **`[E]`** toggle. UI Layer Stack axiom (S19): vrstva 3.5 Floating workspace.

- **Pozice:** pravý okraj canvasu, margin ~12 px nahoře i dole (prostor mezi Top a Bottom Barem).
- **Šířka:** ~420 px (nebo 30 % viewport, dle finálního tuningu).
- **Pozadí:** `COL_HULL_DARK` alpha 0.9 + stroke border `UI_BORDER_DIM` (axiom S19).
- **Font:** Jersey 25, size `FONT_SIZE_HINT` (16 px), monospace rytmus.
- **Řádek:** `[T:D.HH:MM]  ICON VERB  actor/loc  detail` — barva podle severity.
- **Header:** nadpis `EVENT LOG` + filter chips + close `✕`.
- **Footer:** `N / 500 events   [clear]`.
- **Scroll:** auto-bottom na nový event; manuální scroll pauzuje autoscroll, resume na bottom.
- **Žádná pauza simulace** — čas běží při otevření i při scrollu (Perpetual Observer axiom).
- **ESC** zavře (UI Layer Stack globální exit).

### Click-through navigation (IDEAS S20, P2+)

Klik na event s `loc` = camera jumps + bay selection highlight. Odloženo do IDEAS, ne v FVP.

---

## Responsive Layout axiom (S24, KISS revize)

Canvas = viewport (`Phaser.Scale.RESIZE` na `window.innerWidth × window.innerHeight`). **Všechny UI velikosti jsou fix** — žádné min/max, žádný lerp. Resize přepočítá jen CANVAS_W/H a re-centruje BELT; hvězdné pozadí se dogeneruje.

### Fix rozměry

| Prvek | Hodnota |
|---|---|
| Top Bar (HUD) výška | **60 px** |
| Bottom Bar (Log ticker) výška | **60 px** |
| BELT bay | **80 px** (native 40 × scale 2) |
| Segment | **640 × 160 px** (8 × 2 bays) |
| Floating panels (Event Log, Info) | **420 × 576 px** |
| Text v panelech | **18 px** |

### Chování při změně velikosti okna

- **Větší okno:** přebytek = **hvězdné pozadí** (dogenerované 2D chunks). BELT se re-centruje.
- **Menší okno:** panely **přetékají**. Uživatel zvětší okno. Žádný zoom, žádný kolaps, žádná degradace čitelnosti.

### Hvězdné pozadí (`background.ts`)

2D chunk-based procedural generator — `setSize(w, h)` dogeneruje dlaždice obou os při resize. Chunks mimo viewport se uvolní.

### API

- `recomputeLayout(vw, vh)` — přepíše `CANVAS_W`, `CANVAS_H`, `MID_Y`, `MID_H`, `SEGMENT_X`, `SEGMENT_Y`. Konstanty jsou `let` exporty (live ES module bindings).
- `GameScene.handleResize()` volá `recomputeLayout` + `background.setSize` + `segment.relayout` (re-center bays) + `eventLog.relayout` (pravý roh) + `layoutLogCommands` (centrovaný Bottom Bar).
- Další panely relayout nepotřebují: **HeaderPanel** čte `CANVAS_W` v render() každý frame, **InfoPanel** je v levém rohu s fix pozicí.

### Záměrné kompromisy (KISS)

- **Text nemění velikost** při resize. Pro malá okna user zvětší; pro velká okna přebytek dorovná pozadí.
- **Žádné breakpointy** (compact/normal/wide). Jeden layout pro všechny rozměry.
- **Žádný portrait mode** pro FVP (8×2 BELT přetéká pod ~700 px šířky).

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

**Izomorfismus:** stejné zdroje (◎, Solids.food, Fluids.air, …) se v obou módech zobrazují v **Top Baru**, ale jiná škála — kolonijní vs. osobní. Pojmenování jednotek shodné.

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
