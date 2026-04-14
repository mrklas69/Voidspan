# POC_P1.md — První proof of concept

Verze: **0.7** (2026-04-13, Sezení 7 — §18 závěrečné dialogy)

Minimální hratelný sim Voidspanu ve formátu **single-player puzzle** s brzkou WIN/LOSS podmínkou. Inspirace: Puzzle mód z PocketStory.

> POC_P1 **není MVP**. Je to dialogový artefakt pro P1–P4 (blízcí autora). Cíl = zjistit, zda jádro zážitku baví; ne udržet hráče.

---

## 1. Goal & hypothesis

**Goal:** Dostat na stůl nejmenší možný interaktivní artefakt, který (a) ilustruje tón Voidspanu, (b) otestuje čitelnost Energy Modelu (W/WD), (c) ověří scénář SHIP Wake-up jako onboarding.

**Hypothesis:**
> Hráč dostavší se do WIN konce řekne: *„To bylo překvapivě hutných 15 minut, chtěl bych vědět, co bude dál."*

Hráč dostavší se do LOSS konce řekne: *„Dáme ještě jeden pokus."* (Přestože mu hra restart explicitně nenabízí — jen refresh.)

---

## 2. Format

- **Single-player puzzle**, žádný multiplayer, žádný chat.
- **Jeden pokus** — po WIN/LOSS závěrečný dialog, konec. Pro další hru = refresh/restart stránky.
- **Bez brains.** Hráč dává přímé příkazy dronům/kolonistům.
- **Volatilní svět** — stav se po zavření session nepřenáší. Záloha/dump DB až v P2+.
- **Délka:** 10–20 min wall-clock (target), ladí se `TIME_COMPRESSION`.

---

## 3. World scope

**SHIP = 1 SEGMENT = 2×8 = 16 BAYS.** (Revize S5 — 2. segment byl zbytečná rezerva, modulová math se vešla do jednoho.)

**Startovní rozložení modulů (14 bays z 16, 2 volné pro stavbu):**

| Modul | Velikost | Poznámka |
|---|---|---|
| Habitat | 1×1 | 1 kolonista probuzený (hráč) |
| SolarArray | 1×1 | Napájení |
| Engine | 2×2 | **K demontáži** |
| Storage | 1×1 | Zásoby (X dní jídla/vzduchu) |
| MedCore | 1×1 | |
| Assembler | 1×1 | Výroba modulů z Coin (◎) |
| CommandPost | 1×1 | UI root |
| `[damaged bay]` | 1×1 | **Únik vzduchu — vzniká při startu** |
| `[empty]` + `[empty]` | 2×1 | Volné bays pro stavbu Docku 2×2 |

**Drony v poolu:** Constructor + Hauler (počty ladí kalibrace). Marshals/Medics/Fighters mimo scope.

**Kolonisté v kryo:** 7 spících v Habitats / Storage (probuzení je mimo P1 scope; hráč je 8. — Founding Colonist #1).

---

## 4. Scenario

### 4.A — Krize: Únik vzduchu

**Trigger:** ihned po probuzení hráče.
**Mechanika:** Jeden bay se rozbije, vzduch v SHIPu klesá lineárně. Hráč musí poslat Constructor(y) utěsnit.
**Timeout:** `CONST_PUZZLE_SLACK_FACTOR × optimum_repair_time` (default 2×).
**LOSS:** Vzduch → 0, všichni umírají (včetně kolonistů v kryo). Závěrečný dialog + fade.
**WIN sub-stav:** Bay opraven → scénář přechází do 4.B.

### 4.B — Normal task: Engine → Dock

**Cíl:** Demontovat Engine (2×2, 120 WD z S5) a na stejném místě postavit Docking Station (2×2).
**Narativ:** Dock umožní připojit moduly flotily, které parkují opodál (Greenhouse, další Habitat, další SolarArray — nejsou součástí P1 WIN podmínky, jen indikátor rozšíření).
**Rozpočet zdrojů (Coin ◎, Energy E — Resource Model v0.1):** ladí se tak, aby optimum bylo realizovatelné a slack factor 2× dával rezervu na omyly.
**WIN:** Dock ve stavu `docked` (= online + minimálně 1 modul flotily připojený).
**LOSS:** Zásoby jídla/vzduchu vyčerpány dřív, než je Dock hotový.

### 4.C — Volitelný bonus

Po WIN z 4.B zůstává čas do timeoutu session. Hráč může:
- Postavit 2. Habitat z Assembleru.
- Postavit 2. SolarArray.
- *(Probuzení dalšího kolonisty je mimo P1 scope.)*

Splnění C = „perfect ending" flavor text, neovlivňuje WIN/LOSS klasifikaci.

---

## 5. Mechanics in-scope

- **Energy Model W/WD** v plném rozsahu (viz GLOSSARY §Energy Model).
- **Time compression** — parametr, ladí se playtestem. Default `TIME_COMPRESSION ≈ 16×`.
- **Drone fleet** — Constructor + Hauler, kapacita W omezená SolarArray výkonem.
- **Stavební katalog:** Docking Station 2×2, Habitat 1×1, SolarArray 1×1.
- **Demontáž:** Engine (jediná demolice v P1, pevně skriptovaná).
- **Resource drain:** jídlo + vzduch klesají v čase; Storage má konečné množství.
- **UI:** text/tabulka (grafika = samostatné Art sezení).
- **WIN/LOSS dialog:** krátký závěrečný text, fade, konec.

---

## 6. Mechanics out-of-scope (explicit)

Tyto systémy **nejsou** v P1 a jejich absence není bug:

- Brains / offline scheduling
- Multiplayer, chat, komunikace
- Persistence mezi sessions
- Belt (vše za hranicí SHIPu)
- Marshals, lawlessness, justice
- Faction Hierarchy, politika, hlasování
- Event log (může se zapnout pro debug)
- Research tree, technologie
- Capsule onboarding (Founding Colonist Invitation = narativní rámec, ne mechanika)
- Greenhouse stavba (jen narativní motiv „flotily parkující za Dockem")
- Probuzení dalších kolonistů
- Entropie / decay cells
- Orbital Shift
- Monetizace (žádná)
- Modeartion, LLM
- Grafika mimo placeholder bays

---

## 7. WIN / LOSS podmínky

**WIN:**
1. Krize 4.A vyřešena (Únik vzduchu utěsněn).
2. Engine demontován.
3. Docking Station online ve stavu `docked`.

**LOSS (kterékoli):**
- Vzduch → 0 během 4.A timeout.
- Jídlo nebo vzduch → 0 během 4.B.
- Hráč uzavře session před dokončením.

Po obou koncích: **závěrečný dialog + fade + link „refresh = nová hra"**.

---

## 8. Kalibrace

**Univerzální heuristika:**

```
CONST_PUZZLE_SLACK_FACTOR = 2
```

Pro každý timeout / budget v puzzle módu:
> `budget = 2 × optimum_provedení_s_max_nasazením_zdrojů`

Aplikuje se na:
- Délku timeoutu Úniku vzduchu (4.A).
- Zásoby jídla/vzduchu vzhledem k délce 4.B při optimálním postupu.
- Energii pro Dock stavbu (vs. kapacita SolarArray).

Konkrétní hodnoty se určují playtestem, ne dopředu.

---

## 9. Asset list

→ Viz samostatné **Art sezení** (TBD) a **`art/README.md`** pro pipeline. Přehled potřebných assetů:

**Moduly (bay sprites, 40×40 native):** SolarArray, Docking Station, Engine (P1 katalog). Habitat/Storage/MedCore/Assembler/CommandPost jsou P2+.
**Bays (stav políčka):** floor (prázdná podlaha), damaged (poškozený trup).
**Aktéři:** Kolonista (idle/walk/work), Constructor drone, Hauler drone, kryo-kolonista (static).
**Flotila:** silueta-sprity parkujících modulů u SHIPu.
**VFX:** air-leak particle, build progress bar, weld/spark.
**UI:** Resource HUD, session clock, action menu, WIN/LOSS screen, module inspector.
**Audio (optional):** ship hum, alarm loop, build SFX, WIN/LOSS sting.

### Konvence

- **Rozlišení:** 40×40 px native, PNG 32-bit RGBA.
- **Chroma key:** magenta `#ff00ff` v source PNG = vždy průhledná (project-wide konvence). Pipeline ji převede na `alpha=0`. Magenta se NIKDY nesmí vyskytovat v obsahu.
- **Source vs ship:** `art/<kat>/<name>.png` (source) → `apps/client/public/assets/<kat>/<name>.png` (shipped). Build přes `pnpm build:assets`.
- **Pipeline:** viz `art/README.md` a `scripts/downscale-asset.ps1` / `scripts/build-assets.ps1`.

---

## 10. Kalibrace — seed hodnoty P1-lokální (S7)

**P1-lokální seed hodnoty, ne z GLOSSARY `CONST_*`** (F10 — audit 260413).
GLOSSARY `CONST_*` jsou univerzální konstanty pro P2+ feature set (např. `CONST_BELT_LENGTH = 256`). POC_P1 §10 hodnoty jsou **jen pro tento puzzle** — ladí se playtestem P1–P4 a do GLOSSARY `CONST_*` se povyšují až po kalibraci.

**Terminologie (Resource Model v0.1, S13):** staré „Kredo → Coin (◎)" a „Echo → Energy (E)" retirovány. V kódu i tabulkách §10 platí jen nové názvy.

Logika: **target total wall ~12–15 min** (crisis ~2 min + Engine→Dock ~8 min + rezerva/bonus ~3 min). Slack factor 2× aplikujeme na timeouty. Všechna čísla jsou **nástřel k playtestu**, ne kánon.

### Základní konstanty (power + time)

| Kód | Parametr | Seed | Zdůvodnění |
|---|---|---|---|
| **CAL-S1** | SolarArray 1×1 výkon | **24 W** | Po shrinku z 2×2 (48 W v S5) logicky polovina → izomorfismus |
| **CAL-D1a** | Constructor W | **12 W** | Dva utáhne jeden SolarArray (24 W), třetí už půjde na úkor hráče — zdroj napětí |
| **CAL-D1b** | Hauler W | **8 W** | Menší než Constructor; tři utáhne jedno pole s rezervou |
| **CAL-D1c** | Pool dronů v P1 | **3 Constructor + 2 Hauler** | KISS, 5 aktérů — zvládnutelné UI, dost pro paralelizaci |
| **CAL-T1** | `TIME_COMPRESSION` | **240×** (1 game hour = 15 s wall) | 1 game day (16 h) = 4 min wall → 15 min wall ≈ 4 game days |

### Scénář 4.A — Únik vzduchu

| Kód | Parametr | Seed | Zdůvodnění |
|---|---|---|---|
| **CAL-A1a** | Náklad na opravu | **10 WD** | Malý task, 1 Constructor = 10/12 ≈ 0,83 game day (~3,3 min wall) |
| **CAL-A1b** | Optimum čas | **~3,3 min wall** | 1 Constructor, dedikovaný |
| **CAL-A1c** | Timeout (slack 2×) | **~6,5 min wall** | `budget = 2 × optimum` |
| **CAL-A1d** | Air depletion rate | lineárně do 0 za timeout | Triviální funkce času; urychluje se jen, když timeout blízko |

### Scénář 4.B — Engine → Dock

| Kód | Parametr | Seed | Zdůvodnění |
|---|---|---|---|
| **CAL-B1** | Engine demontáž | **60 WD** | Revize z S5 (bylo 120 WD) — 120 bylo odvozeno z 2-segment SHIP; pro 15min wall target moc. 3 Constructor (36 W) = 1,67 game day ≈ 6,7 min wall |
| **CAL-B2a** | Dock 2×2 stavba (WD) | **48 WD** | 3 Constructor = 1,33 game day ≈ 5,3 min wall |
| **CAL-B2b** | Dock 2×2 (Coin ◎) | **20 ◎** | Předpokládá Storage start = 40 ◎; slack 2× pro chyby |
| **CAL-B3a** | Food depletion | **8 osob × 1 jídlo / game day** | 1 „jídlo" / osoba / herní den (=4 min wall) |
| **CAL-B3b** | Storage food start | **40 jídla** | 40 / 8 = 5 game days = 20 min wall → slack proti 12–15 min target |

### Poznámky k seedům

- **Coin (◎):** v P1 stačí **1 zdroj** (◎ ze Storage), Energy nepoužíváme (úspora složitosti; Energy přijde s Greenhouse v P2).
- **Engine 120 → 60 WD:** S5 hodnotu vědomě revidujeme dolů. P1 je 1 segment, ne 2 — práce se škáluje s objemem.
- **„Game hour = 15 s wall":** agresivní komprese. Pokud hráči nestíhají číst / reagovat, snižujeme na 180× (20 s / game hour). První tuning páka.
- **2 volné bays** na SHIPu pro Dock 2×2 — Engine (2×2) se demontuje *tam*, Dock staví *tam*. Jediné místo, kam Dock pasuje.

Všechny hodnoty se upravují po prvním playtestu. Seed je východisko, ne cíl.

---

## 11. Success / Fail criteria pro P1 samotné

**P1 splnilo účel, pokud:**
- Alespoň 2 ze 4 playtestů (P1–P4) dojdou do WIN.
- Alespoň 3 ze 4 po ukončení vyjádří zvědavost na „co bude dál" (ne nutně hraním).
- Feedback zachytí ≥1 konkrétní designovou otázku, která by bez hry nevyplynula.

**P1 selhalo, pokud:**
- Většina hráčů nechápe, co má dělat (čitelnost).
- Většina hráčů dojde do WIN bez napětí (slack factor moc velký).
- Hráči zmiňují chybějící systém jako blokátor („kde je chat", „chci víc lidí") — znamená to, že single-player puzzle není správná forma POC.

---

## 12. Architektura — pure client, static hosting

**Rozhodnutí (S7):** P1 = **čistě klient v prohlížeči**, static hosting. Žádný backend, žádný log, žádná DB. Kdykoli P2 přinese multiplayer/persistence, server se přidá tehdy — teď by byl mrtvá váha.

**Revize proti v0.2:** původně „thin server, fat client". Po rozhodnutí **no telemetry, no DB** odpadl důvod pro backend. V0.3 zjednodušuje dál.

### Proč ne plný authoritative server
- P1 je **single-player, volatilní, jeden pokus** (§2). Authoritative sim, Colyseus rooms, state sync — všechno pro zatím neexistující multiplayer scope.
- **Render free tier sleep** (15 min) = cold start zabije první dojem u playtestu P1–P4.
- Dev loop 2× pomalejší: dva procesy, CORS, WS reconnect, sdílené schema.
- KISS + „First things first": P1 odpovídá „baví to?", ne „škáluje to?".

### Proč ne čistý client
- **Žánr 40/40/20** — experimentální vrstva (event log ~10M) je designově rovnocenná hraní. Chceme telemetrii už z P1, ne až z P2.
- Izomorfismus s PocketStory (server + frontend) — známý pattern, rychlejší kognitivní rozjezd.
- P2+ stejně potřebuje server — tenký server z P1 se stane kostrou, ne úplným re-buildem.

### Komponenty P1

| Vrstva | Volba | Poznámka |
|---|---|---|
| Klient (sim + render + UI) | **Phaser 3 + TypeScript** | Tick loop, Energy Model, state machine, vše v browseru |
| Build | **Vite** (TS + ESM) | Rychlý dev server, statický bundle |
| Hosting | **GitHub Pages** nebo **Netlify** | Static bundle, zero backend, zero cost |
| Repo | **pnpm workspace**, zatím jen `apps/client` | Monorepo kostra drží místo pro `apps/server` v P2 |

### Out-of-scope pro P1 (přesouvá se do P2+)
- Jakýkoli server (Express, Colyseus)
- Event log, telemetrie
- Databáze (SQLite, PostgreSQL)
- WebSocket / real-time sync
- VPS, systemd, Caddy
- Autentizace, účty, session management

### Telemetrie — rozhodnutí (S7)
**Žádný event log v P1.** Feedback se sbírá **mimo hru** (rozhovor s P1–P4 po playtestu, poznámky). Důvody: (a) experimentální vrstva 40 % má smysl až s multi-colony daty — jeden hráč v puzzle nic neřekne; (b) každý backend přidaný „pro jistotu" zpomaluje rozjezd; (c) POC má minimalizovat kroky mezi nápadem a reakcí blízkého.

---

## 13. Data model — TypeScript skelet

Minimální skelet pro P1. Všechny typy žijí v `packages/shared` (DRY s `apps/client`).

```ts
// === Hodiny ===
// Tick loop: requestAnimationFrame → logický tick 4×/s (250 ms).
// TIME_COMPRESSION 240× → 1 game hour = 15 s wall = 60 logických ticks.

// === Fáze scénáře ===
type Phase = "boot" | "phase_a" | "phase_b" | "phase_c" | "win" | "loss";

// === Svět (root state) ===
type World = {
  tick: number;                       // počet logických ticků od startu
  phase: Phase;
  // Resource Model v0.1 (axiom GLOSSARY). P1 používá podmnožinu os:
  //   Slab.food (S.food), Flux.air (F.air), Coin (◎). Energy/Work v P2+.
  resources: {
    slab: { food: number };           // solid materials → food (seed: 40)
    flux: { air: number };            // fluids+gases → air 0..100 %
    coin: number;                     // měna ◎ (seed: 20)
  };
  segment: Bay[];                    // 16 bays (2 řady × 8 sloupců), index = row*8 + col (row-major)
  modules: Record<string, Module>;    // id → modul
  actors: Actor[];                    // drony + hráč
  tasks: Task[];                      // fronta, setříděná podle priority
  loss_reason?: "air" | "food" | "session_closed";
};

// === Bay (políčko 1×1) ===
type Bay =
  | { kind: "empty" }
  | { kind: "damaged"; wd_to_repair: number }
  | { kind: "module_ref"; moduleId: string; rootOffset: { dx: number; dy: number } };
  // module_ref: bay patří modulu; rootOffset ukazuje na root bay modulu

// === Modul (zabírá 1 nebo víc bays) ===
type ModuleKind =
  | "Habitat" | "SolarArray" | "Engine" | "Dock"
  | "Storage" | "MedCore" | "Assembler" | "CommandPost";

type Module = {
  id: string;
  kind: ModuleKind;
  w: number;                          // šířka v bays (1 nebo 2)
  h: number;                          // výška v bays (1 nebo 2)
  rootIdx: number;                    // index root bay v segmentu
  status: "online" | "building" | "demolishing" | "offline";
  progress_wd: number;                // progres budování/demolice (0..total)
  docked_count?: number;              // jen Dock: kolik modulů flotily zadokovaných
};

// === Actor (dron nebo hráč) ===
type ActorKind = "constructor" | "hauler" | "player";
type Actor = {
  id: string;
  kind: ActorKind;
  power_w: number;                    // Constructor 12, Hauler 8, player 8
  state: "idle" | "working";
  taskId?: string;                    // aktuální přiřazený task
};

// === Task (fronta cílů) ===
type TaskKind = "repair" | "demolish" | "build" | "haul";
type Task = {
  id: string;
  kind: TaskKind;
  target: { bayIdx?: number; moduleId?: string; buildSpec?: ModuleKind };
  wd_total: number;
  wd_done: number;
  assigned: string[];                 // ids actors pracujících na tasku
  priority: number;                   // vyšší = dřív; hráč může měnit
  cost_coin?: number;                 // jen "build"; strhne se při zahájení (◎)
};
```

**Poznámky:**
- **`Bay.module_ref`** umožňuje 2×2 modulům zabírat 4 bays, ale logika se řeší nad `Module` (root bay). Klik na kterýkoli bay modulu → vybere se modul.
- **`docked_count`** u Docku drží WIN podmínku (≥ 1).
- **Energy (E)** v P1 nepoužíváme (úspora, viz §10 poznámky).

---

## 14. State machine — přechody fází

```
boot ──(uživatel klikne "Start")──▶ phase_a
phase_a ──(damaged bay vyhojen)──▶ phase_b
phase_a ──(air ≤ 0)──▶ loss (reason="air")

phase_b ──(dock.status=online ∧ dock.docked_count ≥ 1)──▶ phase_c
phase_b ──(air ≤ 0)──▶ loss (reason="air")
phase_b ──(food ≤ 0)──▶ loss (reason="food")

phase_c ──(hráč klikne "Ukončit den")──▶ win
phase_c ──(air ≤ 0 ∨ food ≤ 0)──▶ loss

win | loss ──(refresh stránky)──▶ boot (nová hra)
```

**Side-effects při přechodech:**
- `boot → phase_a`: damaged bay vzniká na predefinovaném indexu; air start = 100 %.
- `phase_a → phase_b`: bay_damaged → `{ kind: "empty" }`; air stop klesat, regeneruje pomalu.
- `phase_b → phase_c`: odemkne se stavba volitelných modulů (2. Habitat, 2. SolarArray).
- `→ loss`: všichni actors `state: "working"` → halt; UI fade + dialog.
- `→ win`: dialog s shrnutím (čas, bonusy, postaveno).

**Resource drain tick (každý logický tick = 250 ms):**
- `air`: v phase_a klesá lineárně k 0 za timeout CAL-A1c (~6,5 min wall); po opravě regeneruje na 100 % za ~30 s wall.
- `food`: od phase_b tick sníží food o `(8 osob × 1/game_day)` proporcionálně (~1 jídlo / 30 s wall).

---

## 15. Input model — task-oriented

### Principy

- **Hráč zadává cíle**, ne kroky. „Chci tu Dock" → engine najde volné Constructory a přiřadí.
- **Seam pro brains (P2+):** task queue je přesně to místo, kde brains později přebere prioritizaci.
- **Micro override**: hráč může konkrétního drona přiřadit ručně nebo přetáhnout task nahoru/dolů.

### Interakce

**Primární klik na bay:**
- Empty bay → menu: `[Postav Habitat 1×1]` `[Postav SolarArray 1×1]`
- Damaged bay → menu: `[Oprav]`
- Module bay → inspector vpravo + menu: `[Demontuj]` (jen Engine v P1), `[Dock: čekat na flotilu]` (jen Dock)

**Výběr modulu 2×2:** klik na kterýkoli ze 4 bays vybere celý modul (rootOffset → modules[rootId]).

**Task queue panel (pravý sloupec):**
- Seznam aktivních i čekajících tasků s progress barem (`wd_done / wd_total`) a ETA v game-time.
- Přetažení = změna priority.
- Tlačítko `Cancel` (vrátí částečný ◎? v P1 ne — KISS, peníze propadají).
- Tlačítko `Přiřadit drona` pro manuální override.

**Actor panel (levý sloupec):**
- 5 dronů + hráč, každý s kind, power_w, state, aktuální task.
- Klik na actor → highlight jeho tasku v queue.

**HUD (horní lišta):**
- Air % (s barevným warningem pod 30 %).
- Food count.
- Coin (◎) count.
- Wall clock + game clock.
- Fáze (A/B/C).

### Auto-assign algoritmus (engine)

Každý tick:
1. Pro každý `idle` actor: najdi nejvyšší-priority task, který (a) není saturován (málo actors vs. budget), (b) actor má kompatibilní kind (Constructor pro repair/build/demolish, Hauler pro haul).
2. Přiřaď; přepni state na `working`.
3. Drain WD: `wd_done += Σ(power_w_assigned) * dt_game`.
4. Když `wd_done ≥ wd_total` → task hotový, actors → idle.

**Saturace:** task má implicitní strop počtu actors (obvykle 3–4, aby nebyla nulová hodnota přidávání dalších). P1 zjednodušení: bez stropu, Σ W omezená jen SolarArray kapacitou.

**SolarArray kapacita:** Σ `power_w` všech `working` actors ≤ Σ výkonu online SolarArrayů. Pokud překročeno → práce probíhá proporcionálně pomaleji (brownout). KISS varianta; alternativa (fronta, cutoff) je overkill pro P1.

---

## 16. UI wireframe

> **Mode:** P1 je **Observer mode** (viz `GLOSSARY.md` §UI Modes, axiom S15). Top Bar 5 resource bars zobrazuje **kolonijní** zdroje, ne hráčovy. Per-actor HP / osobní inventář jsou Player mode (P2+).

**Target device:** primárně **tablet** (baseline 768×1024 portrait / 1024×768 landscape); desktop a iPhone portrait jako kompatibilní bonus.
**Pixel art baseline:** bay **40×40 px native**, integer scaling 1×/2×/3× (nearest-neighbor, `pixelArt: true` v Phaser config). Na tabletu typicky 1× nebo 2×, na desktopu 2×, na 4K 3×. Non-integer scale rozbije pixel art → držet integer násobky.

### Rozložení — tři ukotvené zóny + plovoucí panely

Viz `GLOSSARY.md` → **UI Layout — panely** pro axiom. Žádné trvale ukotvené sidebary. Main Panel zabírá plnou šířku mezi Top a Bottom Barem.

```
┌──────────────────────────────────────────────────────────────┐
│ ⊙Voidspan v1.0  Teegarden.Belt1.Seg042  T 03:12      [?]Help │  ← Top Bar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                 LEVÝ ORBIT (kapsle, debris)                  │
│                                                              │
│              ╔══════ SHIP SEGMENT 8×2 ══════╗                │  ← Main Panel
│              ║  0  1  2  3  4  5  6  7     ║                │    (full width)
│              ║  8  9 10 11 12 13 14 15     ║                │
│              ╚═════════════════════════════╝                │
│                                                              │
│                 PRAVÝ ORBIT (hvězda, flares)                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ LOG: "Repair started." "C2 assigned to Engine."              │  ← Bottom Bar
└──────────────────────────────────────────────────────────────┘    (event ticker)

         Plovoucí panely (toggle, překrývají Main):
         ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
         │ KOLONISTÉ K │   │ ÚKOLY     U │   │ ZDROJE    Z │
         │ ▸ Player wk │   │ [1] Rep 42% │   │ Air   87%   │
         │ ▸ C1 idle   │   │ [2] Dem 10% │   │ Food   38   │
         │ ▸ C2 work   │   │ [Cancel]    │   │ Coin ◎ 20   │
         └─────────────┘   └─────────────┘   └─────────────┘
         ┌─────────────┐   ┌─────────────┐
         │ UDÁLOSTI  E │   │ PODROBN.  P │
         │ 03:12 Repair│   │ Modul:Eng   │
         │ 03:05 C2 as.│   │ Progr:10/60 │
         │ [filter…]   │   │ [Zrušit]    │
         └─────────────┘   └─────────────┘
```

### Zóny — ukotvené (always visible)

| Zóna | Výška / šířka | Obsah |
|---|---|---|
| **Top Bar (HUD)** | full width, ~60 px | Vlevo: `⊙Voidspan v1.0  <Adresa>  T <čas>`. Vpravo: `[?] Help`. Zdroje zatím ve floating *Zdroje* (kandidát na přesun sem). |
| **Main Panel** | full width, flex | Segment 8×2 (native 320×80, @2× 640×160), bays 40×40 px native. Orbitální dekor nad/pod segmentem. Primární interakce (klik bay / modul) |
| **Bottom Bar (Event Log ticker)** | full width, ~60 px | Poslední 3–5 událostí, kompaktní. Plná historie → Floating Panel *Události* |

### Zóny — plovoucí (Floating Panels, toggle)

Viz GLOSSARY tabulku pro přesné názvy/hotkeys. Specifika P1:

| Panel | Hotkey | P1 obsah |
|---|---|---|
| **Kolonisté** | `K` | 6 řádků: 1 hráč + 3 Constructor + 2 Hauler. Kind, power_w, state, task ref. Klik → highlight tasku. |
| **Úkoly** | `U` | Task queue: repair/build/demolish/haul. Progress bar, assigned actors, cancel. P1 bez drag&drop priority. |
| **Události** | `E` | Filtrovatelný Event Log. P1: scroll + simple filter by severity. |
| **Podrobnosti** | `P` / `Tab` | Kontextový inspector: bay (empty/damaged/module) / modul (2×2, status) / actor / task. |
| **Zdroje** | `Z` | E / W / S (food) / F (air) / ◎ — Resource Model v0.1. P1 plain čísla; P2+ mini-sparkline. |

**Rules:** druhé stisknutí téže klávesy = zavřít. `Esc` = zavřít všechny. Panely lze otevřít souběžně (hráč si skládá workspace); pozice zatím fixní (P1), drag v P2+.

### Ikonografie

**Zdroj ikon: [Tabler Icons](https://tabler.io/icons)** — free MIT, SVG, konzistentní stroke styl. Sedne k 8-bit vibe, přesto čitelné.

**Kandidáti z Tableru:**
- `droplet` → Air
- `apple` → Food
- `coin` → ◎ (dříve Kredo)
- `clock` → Wall/Day
- `robot` → Constructor
- `forklift` → Hauler
- `user` → Player
- `alert-triangle` → Damaged bay / varování
- `tool` → Repair task
- `hammer` → Build task
- `hammer-off` / `trash` → Demolish task
- `package` → Haul task

### Interakce — rekapitulace z §15

- **Klik na bay** → menu kontextových akcí.
- **Klik na modul (kterýkoli jeho bay)** → Inspector + akce.
- **Klik na actor** → highlight aktuálního tasku v queue.
- **Drag task v queue** → změna priority.
- **Klik na „Přiřadit drona"** v Inspectoru → manuální override.

### Out-of-scope pro P1 wireframe

- Settings/options panel (nic ke konfigurování).
- Save/load (volatilní svět).
- Fullscreen toggle.
- Zoom / pan na mapě (segment se celý vejde).
- Minimap (1 segment = není potřeba).

---

## 17. Onboarding — prvních 30 s

**Cíl:** během 30 s hráč chápe *co se děje, co je ohrožené, co ovládá, co je ve hře* — a zachytí tón Voidspanu.

**Princip:** **diegetický onboarding.** Žádný modal tutorial, žádné „Welcome!". Všechny instrukce jsou **in-world texty** (LOG + contextové bubliny). Tón: suché technické/vojenské hlášení, nikoli přátelská hra.

### Timeline

```
t=0s    BLACK SCREEN + fade-in textu:
        "Teegarden.Belt1 — Segment 1"
        "Rok kolonie: 0   Den: 0   Hodina: 06:00"
        [Tlačítko: "Probuzení"]
        Čas neběží, dokud hráč neklikne.

t≈3s    KLIK "Probuzení"
        → cryopod opening animace (2 s)
        → kamera zaostří na Habitat bay

t≈5s    UI fade-in: HUD, Actors, Task Queue (prázdné)
        LOG:
        > Cryopod Alpha: subject Colonist #1 vital.
        > SHIP.Seg1 — startup sequence online.

t≈7s    HULL BREACH TRIGGER
        Air ikona v HUD blikne červeně.
        Damaged bay T5 blikne červeně.
        LOG:
        > ⚠ HULL BREACH detected, Bay 05.
        > Air pressure 98% and falling.

t≈10s   CONTEXTOVÁ BUBLINA #1 (u damaged bay):
        > "Klikni sem."
        (Šipka → damaged bay. Bublina zmizí po kliknutí.)

t≈12s   HRÁČ KLIKNE → menu s jedinou možností:
        > [Oprav (10 WD)]
        (Tlačítko zvýrazněné.)

t≈14s   KLIK "Oprav"
        → Task se objeví v queue.
        → Volný Constructor auto-assign.
        LOG:
        > C1 dispatched to Bay 05.

t≈16s   CONTEXTOVÁ BUBLINA #2 (u Actors panelu):
        > "Tví dronové pracují. Ostatní čekají."
        (Zmizí po prvním kliknutí kamkoli.)

t≈20s   Hráč pozoruje: Air % klesá, progress bar repair roste.
        Může přidat víc Constructorů na task (manuální override),
        nebo počkat.

t=30s   Hráč zná: fázi, cíl, ovládání, tempo.
```

### Pravidla chování bublin

- **Maximálně 2 bubliny v onboardingu.** Víc = vizuální šum, popírá diegetickou strategii.
- **Bublina zmizí po prvním kliknutí kamkoli** (ne nutně na zvýrazněný cíl).
- **Bubliny se zobrazují vždy**, i v opakované hře. Hráč, co zná hru, klikne během 0,3 s a bubliny zmizí dřív, než přečte. KISS: žádný stav „už viděl".
- **V phase_b a phase_c žádné bubliny.** Fáze A naučila interakční model, dál je hráč na svých.

### Tón — příklady

**✓ Správně (suché, military/tech, čárkovité):**
```
⚠ HULL BREACH detected, Bay 05.
Cryopod Alpha: subject Colonist #1 vital.
C1 dispatched to Bay 05.
Dock.status: online. Fleet link pending.
WARN: air pressure 28%.
```

**✗ Špatně (přátelský, didaktický, emotional):**
```
"Oh no! Your ship has a hole! Better fix it quickly!"
"Great job! Your drone is working hard for you."
"Welcome, Colonist! Your adventure begins now."
```

### Rozhodnutí zapsaná (S7)

| # | Otázka | Rozhodnutí |
|---|---|---|
| **Q-P1-Onb-1** | Úvodní klik vs. auto-start | **Klik** „Probuzení" — hráč má kontrolu nad startem času |
| **Q-P1-Onb-2** | Bubliny vždy vs. jen poprvé | **Vždy**, ale zmizí po prvním kliknutí (KISS, žádný stav) |
| **Q-P1-Onb-3** | Fog-of-war vs. celá mapa | **Celá viditelná** — P1 není o průzkumu |
| **Q-P1-Onb-4** | Tón textů | **Suché military/tech reporty**, čárkovité, bez emocí |

---

## 18. Závěrečné dialogy

**Struktura dialogu:**
1. **Header** — tech log line (fáze, čas kolonie, stav).
2. **Narativ** — 2–3 věty, vážný tón, bez emocí přehnaných ani suchých reportů. Peak moment POC.
3. **Signature** — adresa, timestamp in-game.
4. **Footer** — `Nová hra: refresh stránky.`

**Tón:** suchý, ale s gravitací — jako úryvek z kronik kolonie, ne hra. Žádné „You won!" / „Game Over!". Hráč má zůstat v tónu Voidspanu i po konci session.

---

### WIN — varianty

#### WIN-A (základní: Dock online, ≥1 modul flotily zadokován)

```
═══════════════════════════════════════
  PHASE COMPLETE — DOCK ONLINE
═══════════════════════════════════════

Engine off. Dock lights green. První modul flotily
dokloněn a přišroubován. Na orbitě čeká víc.

Kryo tikají. Osm spících zatím neví, že je svět
o maličko pohostinnější než včera.

  — Teegarden.Belt1.Seg1, Rok 0, Den 0, 23:47

Nová hra: refresh stránky.
```

#### WIN-B (s bonusem — postaven 2. Habitat nebo 2. SolarArray)

```
═══════════════════════════════════════
  PHASE COMPLETE — EXPANSION SECURED
═══════════════════════════════════════

Dock drží. Flotila přistává postupně. Pod novou
střechou je místo pro další probuzení — zítra,
nebo pozítří, až zásoby dovolí.

První kapitola kolonie končí tiše. Žádný záznam,
žádná slavnost. Jen funkční systémy.

  — Teegarden.Belt1.Seg1, Rok 0, Den 1, 02:11

Nová hra: refresh stránky.
```

---

### LOSS — varianty

#### LOSS-air-A (vzduch došel během Úniku, krize nevyřešena)

```
═══════════════════════════════════════
  SHIP.SEG1 — LIFE SUPPORT FAILURE
═══════════════════════════════════════

Utěsnění nedokončeno. Tlak klesl pod obyvatelný
práh. Cryopod Alpha — subject Colonist #1 —
přešel do neřízeného odpojení.

Sedm dalších se nedozví nic. Kapsle Teegarden.Belt1.Seg1
zůstává na orbitě, tichá.

  — Signal loss: Rok 0, Den 0, 06:13

Nová hra: refresh stránky.
```

#### LOSS-air-B (vzduch došel během Engine→Dock práce)

```
═══════════════════════════════════════
  SHIP.SEG1 — SLOW ASPHYXIATION
═══════════════════════════════════════

Oprava držela. Dock se téměř postavil. Ale
drobné netěsnosti, které nikdo neměl čas řešit,
vypustily atmosféru pomaleji, než stihla stavba.

Práce pokračovala do posledního dechu. Něco
o lidské povaze v tom je.

  — Signal loss: Rok 0, Den 0, 18:xx

Nová hra: refresh stránky.
```

#### LOSS-food-B (jídlo došlo během Engine→Dock)

```
═══════════════════════════════════════
  SHIP.SEG1 — SUPPLY EXHAUSTION
═══════════════════════════════════════

Storage prázdný. Greenhouse neexistoval. Osm
kolonistů se probudit nestihne — a jediný bdělý
dopracoval to, co dopracovat mohl, než mu došly
síly u nedostavěného Docku.

Flotila na orbitě zůstává. Další kapsle, možná,
jednou.

  — Signal loss: Rok 0, Den 1, 04:xx

Nová hra: refresh stránky.
```

---

### Pravidla implementace

- **Fade-in na černém pozadí**, centrovaný text, monospace font (konzistence s log tónem).
- **Žádný „Play Again" button** — footer je textová instrukce, refresh je fyzický akt, nutí hráče rozhodnout se.
- **Žádná statistika, žádný score**. Peak = narativ, ne číslo (izomorfismus s §1.2 MINDMAP „pamatovatelný příběh ne score").
- **Pauza 1,5 s před první větou** — respekt k momentu, ne okamžitý text dump.
- **Timestamp** v podpisu je game-time aktuálního běhu (dynamicky dosadit).

### Flavor variace (nice-to-have, ne blokátor)

Pro opakované hry zvážit mikro-variace ve druhé větě (±3 varianty na každý dialog) — aby druhý playthrough nebyl identický. **P1 scope:** jedna verze na dialog, variace odložit na P2 nebo playtest feedback.

---

## Reference

- `GLOSSARY.md` — Energy Model, entity, konstanty.
- `SCENARIO.md` §4.0 SHIP Wake-up — narativní rámec.
- `MINDMAP.md` — bod 3.1 (Prostor a čas), fokus 3.2 + 3.3 + Q17.
- `TODO.md` Q17 — uzavřeno tímto dokumentem.
