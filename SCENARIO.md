# SCENARIO.md — Voidspan

Narativní scénář hry. Hybridní model: **autorská páteř + scripted eventy + procedurální generace + hráčská emergence**.

> Viz též `GLOSSARY.md` pro definice pojmů (WORLD/BELT/SEGMENT/MODULE/TILE, SHIP, Energy Model, Capability Matrix, Drone Fleet, Teegarden System, Echo, Kredo, Capsule, Citizen Tier, Tenets T1–T4).

Verze: **0.4** (S6: SHIP revidován na 1 segment, POC_P1 puzzle reference).

> **Pozn. k terminologii (S5):** pojem „Cell" byl retirován. V textu níže (sekce 2.LEGACY, 4.1, 13 a další) stará zmínka „cell" = **segment** (dílek beltu). Migrace textu postupně.

---

## 1. Hybridní model scénáře

Čtyři vrstvy, každá s jiným zdrojem a jiným účelem.

| Vrstva | Kdo určuje | Cíl | Příklad |
|---|---|---|---|
| **Backbone** | Autoři, pevně | Dramatický oblouk, milníky | Act -1 → Act V, Belt Closure |
| **Scripted events** | Autoři, trigger-based | Řízené krize, narativní beaty | „Velitel NPC rezignuje, vyhlašují se volby" |
| **Procedural events** | Engine (+ LLM?) | Drobná agenda, živost světa | Náhodné poruchy, questy, místní spory |
| **Emergent events** | Hráči sami | Politika, aliance, intriky | Volby, zrady, bubliny, občanské války |

**Poměr:** page-designed páteř a scripted ~20 %, procedurální ~30 %, emergentní ~50 %. Páteř dává dramatický oblouk, hráči dodávají duši.

### 1.1 Design kompas — Forgiveness rewarded

Herní mechaniky mají **odměňovat strategie tit-for-tat s odpuštěním** (Axelrod, Prisoner's Dilemma). Cíl: hra má **výchovný efekt pro hráče-diktátory** — dlouhodobě vítězí ti, kdo spolupracují a odpouští, ne ti, kdo jen exploitují. Tento kompas ovlivňuje balancování všech mechanik (ekonomika, politika, recruitment).

---

## 2. Čtyři oblouky (arcs) — nová struktura v0.3

Scénář se rozkládá do **čtyř nezávislých časových oblouků** (viz MINDMAP bod 4). Dosavadní „Act -1 až post-closure" (sekce 2.LEGACY níže) je **Player Arc + Colony Arc smíchaný dohromady**; postupně se rozpustí do nové struktury.

| Arc | Scope | Délka | Kde je v dokumentu |
|---|---|---|---|
| **A Network Arc** | síť beltů v serveru | měsíce–roky | TBD (po R1, viz Q-World-1) |
| **B Colony Arc** | jeden belt od založení po ending | dny–měsíce | sekce 2.LEGACY (přerozdělit) |
| **C Player Arc** | hráč od pozvánky po exit | hodiny–týdny | **sekce 2C níže (draft)** |
| **D Session Arc** | jeden login → logout | minuty–hodiny | TBD (POC-kritické) |

---

## 2C. Player Arc (loop C) — draft v0.3

Oblouk jednoho hráčského účtu. Mnoho paralelních hráčů v jedné kolonii, každý ve své fázi oblouku.

### 1.0 Invitation — pozvánka
Detail v sekci 3 (Act -1). Welcome / email / reklama + motivační dopis + kapsle na orbitu.

### 1.1 Awakening — přijetí + briefing
Detail v sekci 4 (Act 0). Kolonie rozhodne o kapsli → revival → první volba.

### 1.2 Active Life — správcovská smyčka
Jádro hráčského zážitku. **Hráč nastavuje směr, akce běží brains.** Rytmus ~1× denně, viz Session Arc (2D).

**Izomorfismus:** `STATUS × CELL_TYPE → action palette` — paleta **nastavuje brains**, ne klik hráče.

**Schéma postavy (POC):** STATUS + RANK + SKILL. PERK Phase 2+.

Příklady palety (seedy pro brains config):
- `Dělník @ CELL_UNDERCONSTRUCTION.Tile6`
  → Pracuj | Komunikuj | Jdi | Najez se | Spi | Poptávej | Nabízej | Zaútoč
- `Výzkumník @ CELL_ADMINISTRATION.Greenhouse`
  → Zkoumej (Geologie III…) | Jdi na úřad → [doklady, volit, kandidovat]

**Pohyb mezi cells** (`Jdi`) stojí brains čas, otevírá nové palety, dává šanci na potkání.

**Tempo:** time-gated. Akce má duration (minuty–hodiny). Brains drží prioritu, dokud hráč nezmění směr. **Žádná denní energie** v POC — time-gating je cap.

### 1.3 Exit — tři režimy ukončení
Hráč má v ruce, jak svůj oblouk zakončí.

| Režim | Popis | Dopad |
|---|---|---|
| **Dispose** | Rozprodat / rozdat jmění a postavení, opustit hru | Jmění převedeno, postava smazána nebo převedena na NPC |
| **Migrate** | Kapsle do jiné kolonie (vstup do loop A) | Opakuje Invitation + Awakening v cílové kolonii |
| **Delegate (API/AI)** | Pokročilé proxy nad brains: **API bot** (Screeps-style), **AI LLM** | Phase 2+ (viz IDEAS). POC jede jen brains. |

**Poznámka — brains vs. delegate:** Brains jsou **core POC feature**, ne delegace. Delegate režim znamená úplné předání účtu externímu bot/AI, což je Phase 2+. V POC běží jen brains s T2 scope (a) — materiál & provoz, politika/konflikt čekají na hráče.

---

## 2D. Session Arc (loop D) — draft v0.3

Jeden login → logout. Default rytmus: **~1× denně, 10–20 minut**. Hráč je **správce, ne pracovník** — akce běží brains, hráč nastavuje směr a komunikuje.

### D.1 Login — načtení stavu
- **Character snapshot:** STATUS, RANK, SKILLS, aktuální CELL, inventář (Echo/Kredo).
- **Colony dashboard:** populace, ekonomika, highlight z event logu.
- **Brains report:** co brains dělal během offline, co běží, co čeká na rozhodnutí hráče.
- **Notifikace:** nové maily, odpovědi institucí, hlasování, pozvánky.

### D.2 Interact — jádro session
Hráč v libovolném pořadí:

- **Komunikace:** skupinový chat (neprotokolovaný), institucionální mail (správní rada, banka, parlament, šerif), čtení boardů.
- **Obchod:** shop browse, nákup/prodej, nabídka/poptávka.
- **Brains config:** posunout slidery (práce ↔ studium, obrana ↔ expanze), vybrat studijní obor (*geologie III*), změnit priority.
- **Political actions:** petice, kandidatura, hlasování, žádost o povýšení, zakládající návrhy (banka, nová instituce).
- **Diplomacy:** osobní jednání se sousedy, vyjednávání s frakcemi.

**Ilustrativní session (user seed):**
> Přihlásím se. Pozdravím ve skupinovém chatu. Najím se. Zajdu do obchodu. Upravím brains — méně práce, víc studia (geologie III). Napíšu správní radě žádost o povýšení. Přečtu jejich odpověď na můj návrh na založení banky. Odhlásím se.

### D.3 Logout — brains přebírá
- Brains běží s nastaveným směřováním až do dalšího loginu.
- Kritické události → push / email hráči (nepovinné).
- **Žádná akční fronta hráče** — vše dělá brains. Hráč zadává **strategii**, ne jednotlivé kliknutí.

---

## 2.LEGACY — dosavadní Act -1 až Post-Closure

**Status:** přerozdělit do Colony Arc (2.1 založení až 2.7 ending) a Player Arc (1.0, 1.1). Zatím ponecháno beze změny pro kontinuitu.

---

## 2. Backbone — páteř scénáře (legacy)

Pre-game Act -1 + pět hlavních Actů + post-closure fáze.

### Act -1 — Invitation & Capsule (pre-game)

- **Cíl:** Přetavit potenciálního hráče v zainteresovaného kolonistu ještě před první herní akcí.
- **Trigger začátku:** Příchod skrze welcome stránku / email / reklamu.
- **Trigger konce:** Kapsle hráče je vypuštěna do orbity a čeká na rozhodnutí existující kolonie.
- **Centrální napětí:** Dočkám se oživení? Proč by mě měli vybrat?

*Detail níže v sekci 3.*

### Act 0 — Awakening (Onboarding)

- **Cíl:** Hráč se probudí, dostane briefing, rozumí světu, provede první volbu.
- **Trigger začátku:** Kapsle byla kolonií přijata a hráč probouzen.
- **Trigger konce:** Hráč opustí fish-processing dílnu a učiní první vědomou volbu.
- **Centrální napětí:** Kdo jsem? Kde jsem? Co mě zachrání?
- **Trvání:** 30–60 minut hráčského času.

*Detail níže v sekci 4.*

### Act I — First Steps & Basic Loop

- **Cíl:** Hráč pochopí ekonomiku (Echo/Kredo), postaví první strukturu nebo si vydělá první mzdu.
- **Trigger začátku:** Konec Act 0.
- **Trigger konce:** Hráč má funkční příjem a první vlastní cell nebo stabilní práci.
- **Centrální napětí:** Pracovat pro kolonii (jistota) nebo riskovat claim (jackpot)?
- **Trvání:** hráčské dny až týdny.

### Act II — First Institutions

- **Cíl:** Kolonie přechází z NPC-spravované na hráči-spravovanou.
- **Trigger začátku:** Populace kolonie překročí threshold.
- **Trigger konce:** Funkční parlament, volený šerif, první soudní spor.
- **Centrální napětí:** Kdo má moc? Jaká pravidla si dáme?
- **Trvání:** serverové týdny až měsíce.

### Act III — Crisis(es)

- **Cíl:** Kolonie čelí krizi. Iterovatelné (IIIa, IIIb, IIIc).
- **Centrální napětí:** Přežít bez autoritářství? Upnout se na silnou ruku? Rozdělit se?
- **Typy krizí:** epidemie, ekonomický kolaps, vražda, vlna nových kolonistů, trhlina v beltu, orbitální incident.

### Act IV — Belt Approach

- **Cíl:** Belt se blíží k uzavření, poslední segmenty jsou politicky drahé.
- **Trigger začátku:** Belt dosáhne ~80 % obvodu.
- **Trigger konce:** Poslední cell před hubem dokončen.
- **Centrální napětí:** Kdo postaví „poslední cell"? Boj o prestiž.

### Act V — Belt Closure Event

- **Cíl:** Ceremoniální spojení posledního cell s hubem. Historický zápis řádu ~10M.
- **Centrální napětí:** Žádné. Oslava.
- **Trvání:** hodiny až den.

### Post-Closure — New Game Dynamics

- **Cíl:** Hra se posune od expanze k hustotě, konkurenci, politice.
- **Trigger konce:** Žádný pevný; pokračuje do některého koncového stavu (viz sekce 6).

---

## 3. Act -1 — Invitation & Capsule (detailně)

### 3.0 Dva typy pozvánky (od S5)

**(A) Founding Colonist Invitation** — pro prvních `CONST_FOUNDING_CREW = 8` hráčů beltu.

> *„Staň se zakládajícím kolonistou! Oživení v rovnocenném postavení zaručené."*

- Žádná nejistota (žádný limbo / recycling).
- Startují jako **Full Citizens** v Habitatu SHIPu.
- První hráč online = první probuzený z kryo, následující se probouzí postupně, jak přijímají pozvánku.
- První vlna kolonie spoluutváří pravidla, instituce i ústavu. Kolonie nedědí žádný předpis — musí ho sama vymyslet.
- Onboarding scénář detailně viz sekce 4.0 *SHIP Wake-up*.

**(B) Capsule Invitation (Hail Mary)** — pro pozdější vlny (po zaplnění Founding Crew).

- Kapsle na orbitě, nejistota revival / limbo / recycling.
- Hráč startuje v citizen tier **Indenture** nebo **Probationary** (rozhoduje vláda kolonie).
- Klasická pipeline z Act -1 detailů (3.1–3.5 níže).

### 3.1 Welcome / pozvánka

Kanál doručení: welcome stránka, emailová pozvánka, případně placená reklama. Tón:

> *„Ahoj. Asi jsi si nějak zasloužil účast v novodobé Noemově arše… Slož částku na účet [fiktivní IBAN], dej do pořádku své pozemské věci, dostav se k nalodění. Není jisté, že budeš někdy obnoven. Možná pomůže tvůj motivační dopis…"*

**Fiktivní bankovní účet** v textu pozvánky je **atmosférický prvek**, nikoli reálná transakce. Hráč nic neplatí. Účel: navodit vážnost rozhodnutí, emocionální investici, tón sci-fi reality.

### 3.2 Motivační dopis

Pole `[TEXT_AREA]` — hráč vysvětluje, **proč by ho měl někdo v budoucnu obnovit, místo aby ho rovnou zrecykloval**.

- Dopis se stává součástí světa (world-lore).
- Čitelný existujícími kolonisty a jejich vládou při rozhodování.
- I po recyklaci zůstává v **Legacy Letter Archive** jako historický text — vzdělávací pro nové žadatele („tyto dopisy uspěly, tyto ne").
- Moderace: LLM pre-filter + hráčské flagging (viz sekce 11.4).

### 3.3 Kapsle na orbitě

Po odeslání pozvánky → kapsle („rakev", „Hail Mary") se objeví v orbitě cílové kolonie a **generuje event na oběžné dráze**: *„Nová kapsle detekována"*.

Osud kapsle závisí na rozhodnutí **vlády kolonie** (sekce 12). Do rozhodnutí kapsle čeká; po timeoutu automaticky recyklována (viz 12.3).

### 3.4 Pre-game ghost experience

Během čekání na rozhodnutí hráč má k dispozici:
- **Prohlížení své kapsle** v orbitě (live view).
- **Čtení archivu kolonie** (EventLog, veřejné dokumenty).
- **World Browser** — prohlížení i jiných aktivních beltů a historických (zaniklých) jako EventLog archivů.
- **Pozorování rozhodovacího procesu** (kdo, kdy, jak rozhoduje o kapsli).

Přetaví čekání na content. Emotivně sesiluje investici do hry.

### 3.5 Timing

Delay mezi odesláním pozvánky a rozhodnutím = **hodiny až 1–2 dny**. Kratší → ztráta dramatu. Delší → ztráta hráče.

---

## 4. Act 0 — Awakening (detailně)

### 4.0 SHIP Wake-up (Founding Colonist scénář, od S5)

Pro zakládající posádku platí **odlišný onboarding** od kapslové varianty. Probuzení probíhá přímo na mateřské lodi zaparkované na orbitě Teegardenu.

**Startovní stav (revize S6 — SHIP = 1 segment, viz GLOSSARY §SHIP):**
- 8 kolonistů v kryo v Habitatu. Probouzí se postupně podle přijetí pozvánek.
- Dostupná energie: 1× SolarArray 1×1 = TBD W (re-kalibrace po shrinku z 2×2).
- Zásoby ve Storage: cca X dní jídla / vzduchu (TBD kalibrace). **Greenhouse parkuje u SHIPu** — připojí se po dostavbě Docku.
- Flotila dronů: Constructors + Haulers + Marshals. Energie omezuje počet simultánně aktivních aktorů.
- Instituce: integrovaně v `CommandPost` (včetně Observatory).
- **POC_P1 scope:** viz `POC_P1.md` — single-player puzzle s krizí Úniku vzduchu + Engine→Dock.

**Úvodní zpráva prvnímu probuzenému:**

> *„Jsi prvním probuzeným členem posádky. Momentálně nelze probudit nikoho dalšího — omezené množství energie k provozu max. 4 dronů. Měl bys učinit některá rozhodnutí, ale počítej s tím, že to potrvá."*

**Doporučené úvodní akce (briefing):**

| Akce | Náklad | Trvání (orient.) | Výnos |
|---|---|---|---|
| (a) Spustit SolarArray #2 | … | … | +48 W |
| (b) Postavit Greenhouse | … | … | Zastaví pokles zásob |
| (c) Probudit dalšího kolonistu | Echo | … | +1 hráč online |
| (d) Vyslat průzkum sousedního segmentu | … | … | Informace |
| (g) **Rozebrat modul motorů** | 120 WD → 4 Constructors + 1 hráč = 48W | **~2,5 dne hry (~2,5 h wall)** | **+4 Echo, +80 Kredo, Dock slot** |

Tempo záměrně pomalé. *Trpělivý přístup.* Hráč zadá akci → brains ji vykoná → další session (po wall-clock hodinách) vidí výsledek.

**Konec scénáře SHIP Wake-up:** probuzeno alespoň 3 kolonistů + postavena Greenhouse + Dock odemčen. Kolonie přechází do Act I.

### 4.1 Tři varianty přijetí

**Var 1 — Recycling.**

> *„Smutná zpráva: Byl jsi zrecyklován bez možnosti dalšího oživení. Kdy už se konečně naučíš psát motivační dopisy!"*

Hráčský účet končí v této kolonii. Motivační dopis zůstává v Legacy Letter Archive. Hráč může **napsat novou kapsli** (s poučením z archivu) a zkusit znovu — buď do stejné kolonie s odstupem, nebo do jiné.

Surovinový výnos z recyklace (minimum Echo/Kredo) připadne vládě kolonie.

**Var 2 — Limbo.**

> *„Dobrá zpráva! Kolonie [ID_COLONY] zachytila tvoji kapsli. Nebyl jsi zatím zrecyklován. Možná se tak stane později, ale možná se dočkáš oživení."*

Kapsle je ve frontě. Hráč může průběžně sledovat stav přes ghost experience. Rozhodnutí přijde později (další iterace recruitment procesu).

**Var 3 — Revival.**

> *„Ahoj! Před několika měsíci jsme zachytili tvoji rakev. Kolonie se rozhodla pro tvoje oživení!"*

Následují onboarding instrukce. Přijem může provést **živý hráč** (v roli doktora / velitele) nebo **automat NPC** (pokud žádný hráč není v dané roli aktivní).

### 4.2 Místo a atmosféra (při revival)

Probuzení z kryospánku v prostoru, který byl **narychlo přestavěn** na nemocnici — původně **dílna na zpracování ryb**. Zápach, improvizovaná lůžka. Kolonisté nebyli hrdinové, byli náklad.

### 4.3 Mlhavé vzpomínky

Hráč nepamatuje prequel. Chrání **Tenet T1** (Prequel stays open).

### 4.4 Briefing

1. Kde jsi — jméno hvězdy (Q12 otevřená), soustava, statistika kolonie.
2. Co je kolonie — vertikální pás stavěný do kruhu, dva zdroje, hub uprostřed.
3. Co máš — startovní výbava (závisí na citizen tier, viz sekce 13).
4. Co můžeš — volby podle tieru.
5. Co se děje — aktuální politický stav, krize, volby.

### 4.5 První volba

Hráč volí podle tieru (viz 13). Plnoprávný: stake claim / employment / průzkum. Probační / Indenture: omezený set voleb.

---

## 5. Scripted Events (page-designed pool)

**TBD — k rozpracování.** Struktura eventu: trigger, weight, description, hooks, outcomes.

Příklady:
- „Velitel-NPC rezignuje" → vynucuje volby.
- „Banka zjišťuje dluhovou bublinu".
- „Šerifova vražda".
- „Velká vlna nových kolonistů".

### 5.A Observatory Event — první detekce dalšího beltu

**Trigger:** kolonie postavila / upgradeovala Observatory (zatím integrovaná v CommandPost, později dedikovaný modul). Scripted event se spustí při dosažení prahu výzkumu nebo po první Orbital Shift.

**Zpráva kolonii:**

> *„Naše observatoř zaznamenala novou mateřskou loď na orbitě. Patří k nám, nepřítel, mimozemšťané…? Nejsme sami. Od teď musíme rozlišovat. Naše adresa: `Teegarden.Belt1`. Objekt identifikován: `Teegarden.Belt2` (je nad námi)."*

**Navrhované akce:**
- (a) Ignorovat (pasivní pozorování).
- (b) Vyslat diplomatický signál.
- (c) Posílit vlastní obranu / armaturu.
- (d) Vyslat průzkumnou loď (Echo/Kredo náklad).

**Dopad:** přechod z izolovaného Belt1 na **Belt Network (R1)**. Odemyká mezi-kolonijní frakce, obchod, diplomacii a konflikt. Změna default adresy kolonie.

---

## 6. Endings Spectrum

Spektrum stavů, do kterých může kolonie dospět (nikoliv binární).

| Ending | Popis | Spouštěč |
|---|---|---|
| **Flourish** | Belt uzavřen, instituce stabilní, prosperita | Belt Closure + metriky stability |
| **Stagnation** | Belt uzavřen, populace klesá | Po closure + odliv |
| **Schism** | Rozdělení na frakce, studená válka | Politický konflikt bez násilí |
| **Civil War** | Otevřené násilí, instituce padají | Eskalovaný schism |
| **Extinction** | Populace → 0, belt jako ruina | Terminál civil war + entropie |
| **Abandonment** | Hráči odejdou, dormant | Pokles aktivity pod threshold |
| **Reset** | Hlasování o nové iteraci | Explicitní hlasování |

Každý stav = legacy záznam v meta-historii serveru. **Zaniklé belty zůstávají přístupné přes World Browser** jako historické EventLogy.

---

## 7. Factions & Power Dynamics

**TBD.** K rozpracování.

Pole: formální frakce (instituce), neformální (aliance), NPC → hráč transition, korupce a zrada jako mechaniky.

---

## 8. Immigration Mechanics

**TBD.** K rozpracování. Propojeno s Act -1 (kapsle na orbitě) a sekcí 12 (recruitment process).

Nápady: vlny > plynulý přísun; velikost vlny = funkce stability; parlament hlasuje o imigrační politice.

---

## 9. Procedural Layer

**TBD.** Otázky: co generuje engine deterministicky, co LLM. Parametry. Fallbacky.

---

## 10. Emergent Layer

**TBD, dokumentační spíše než normativní.** Autoři kodifikují zajímavé vzorce, které hráči emergentně vytvoří (např. klany, tajné dohody).

---

## 11. Monetization & Onboarding Pipeline

### 11.1 Monetizace

**Žádná real-money transakce** v MVP. Všechno free.

Potenciálně později: **buymeacoffee** nebo podobný **volitelný** model. Hra **nikdy** nebude pay-to-win, pay-to-revive, nebo pay-to-skip.

### 11.2 Fiktivní účet v pozvánce

IBAN / účet zmíněný v pozvánce je **narativní rekvizita**, ne funkční platební kanál. Účel: atmosféra, vážnost, emocionální investice hráče. Nikam se neodkazuje, hráč nic neposílá.

### 11.3 Onboarding pipeline

```
welcome page / email / ad
    ↓
registration + motivační dopis
    ↓
kapsle generována + orbita event
    ↓
ghost experience (čekání, world browser, archiv)
    ↓
rozhodnutí kolonie (viz sekce 12)
    ↓
Var 1: Recycling  | Var 2: Limbo  | Var 3: Revival
                                     ↓
                                    Act 0
```

### 11.4 Moderation motivačních dopisů

- LLM pre-filter (vulgarity, spam, politické provokace).
- Hráčské flagging s review.
- Hard limits (délka, frequency per IP/účet).
- Ban policy pro opakované porušovatele.

---

## 12. Recruitment Process (jak kolonie rozhoduje o kapslích)

### 12.1 Rozhodovatel

**Vláda kolonie.** Forma vlády je emergentní a mění se v čase:

- **Ranný stav** — NPC velitel + doktor, automatizované rozhodování.
- **Po Act II** — volený parlament nebo zvolený šerif/starosta.
- **Degenerativní scénář** — jediný diktátor (pokud to kolonie dopustí).

Kdo právě tvoří vládu, ten rozhoduje. Design kompas (sekce 1.1) ale **odměňuje inkluzivní strategie**, ne dlouhodobě destruktivní.

### 12.2 Aktivní sběr a posouzení

Vláda může:
- **Schválit revival** konkrétní kapsle → hráč oživen (Var 3).
- **Ponechat v limbu** → čeká dál (Var 2).
- **Aktivně recyklovat** kapsli pro minimum Echo/Kredo → Var 1.

### 12.3 Automatická „auto-reply" recyklace (timeout)

Pokud vláda nerozhodne do timeoutu, **automat zrecykluje kapsli** s laskavou zprávou:

> *„Obávám se, že tvoje naděje na oživení zde není vysoká. Ale třeba se dočkáš oživení ve světě, kde je tvoje chování považováno za zajímavé, přínosné…"*

Analogie: auto-reply při dlouhodobé nepřítomnosti. Hráč má možnost zkusit znovu (nová kapsle).

### 12.4 Auto-hunting kapslí (pokročilý tech)

Kolonie může **výzkumem** odemknout technologii **auto-hunting** — dron / AI, který proaktivně sbírá kapsle z orbity podle nastavených kritérií (třídí motivační dopisy, recykluje nevhodné, přijímá perspektivní). Pokročilá fáze hry.

### 12.5 Surovinový výnos recyklace

Každá zrecyklovaná kapsle = malé, ale reálné množství **Echo/Kredo**. Kolonie tak má pobídku recyklovat (surovinová politika) vs. přijímat (populace, pracovní síla, kultura).

---

## 13. Citizen Tiers (strata nováčka)

Nově oživený hráč nezačíná automaticky jako plnoprávný. Tři tiers:

### 13.1 Indenture (zadlužený kolonista)

- Minimální práva, nemůže vlastnit claim, minimální komunikace mimo přiděleného patrona.
- Přidělený patron = existující hráč / instituce.
- Cesta ven: splacení „kryospánkového dluhu" prací; doporučení patrona; milost parlamentu.
- Typická doba: dny až týdny hráčského času.
- **Literární rámec:** ne „otrok", ale **„Indenture"** / **„Kryodlužník"**. Pojem ekonomický, ne osobnostní.

### 13.2 Probationary (probační občan)

- Základní práva, může vlastnit claim, má hlas v menších rozhodnutích, ale ne v parlamentu.
- Cesta ven: čas + nulový konflikt + úspěšné dokončení onboarding questů.
- Typická doba: týdny hráčského času.

### 13.3 Full Citizen (plnoprávný občan)

- Všechna práva: volit, kandidovat, vlastnit claim, navrhovat zákony.

### 13.4 Ústavní garance

- **Cesta ven je vždy dostupná.** Vládě kolonie je ústavně zakázáno tier permanentně uzamknout. Tenet T3 „Foundations before curtains" aplikován na práva: nemůže být odebráno hráčovi právo vystoupat.
- Pokud vláda poruší, parlament / soud / ústavní mechanismus to napravuje. Pokud selhává i to = **známka degenerace kolonie**, scénář vede k civil war / schism / reset.

---

## 14. Otevřené otázky scénáře

- ~~Q12: Jméno hvězdy~~ — vyřešeno v S5: **Teegarden's Star** (SO J025300.5+165258).
- ~~Q13: `CONST_BELT_LENGTH`~~ — vyřešeno v S5: **256**.
- Přesné thresholdy pro Act triggery.
- Timeout recyklace kapsle (hodiny? 1–2 dny? závisí na aktivitě kolonie?).
- LLM integrace v moderaci a procedurální vrstvě — rozsah.
- Délka jedné iterace beltu v reálném čase.
- Mechanika „Reset" hlasování — kvórum, konsekvence.
- Přesné mechaniky cest mezi citizen tiers (čas, quest milníky, patron systém).
- Ekonomická kalibrace výnosu recyklace (kolik Echo/Kredo z kapsle).
- Výzkumný strom (kdy / jak se odemyká auto-hunting).
