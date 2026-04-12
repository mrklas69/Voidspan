# SCENARIO.md — Voidspan

Narativní scénář hry. Hybridní model: **autorská páteř + scripted eventy + procedurální generace + hráčská emergence**.

> Viz též `GLOSSARY.md` pro definice pojmů (Belt, Cell, Hub, Echo, Kredo, Capsule, Citizen Tier, Tenets T1–T3).

Verze: **0.2** (přidán Act -1 Invitation, rozšířen Act 0 o varianty přijetí a citizen tiers, doplněny sekce monetizace / recruitment / citizen tiers).

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

## 2. Backbone — páteř scénáře

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

- Q12: Jméno hvězdy.
- Q13: `CONST_BELT_LENGTH` pro první iteraci.
- Přesné thresholdy pro Act triggery.
- Timeout recyklace kapsle (hodiny? 1–2 dny? závisí na aktivitě kolonie?).
- LLM integrace v moderaci a procedurální vrstvě — rozsah.
- Délka jedné iterace beltu v reálném čase.
- Mechanika „Reset" hlasování — kvórum, konsekvence.
- Přesné mechaniky cest mezi citizen tiers (čas, quest milníky, patron systém).
- Ekonomická kalibrace výnosu recyklace (kolik Echo/Kredo z kapsle).
- Výzkumný strom (kdy / jak se odemyká auto-hunting).
