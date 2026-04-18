# Voidspan — Arena Brief (S34)

Zadání pro vizuální soutěž AI modelů (arena.ai a podobné). Cíl: originální návrh **celé herní plochy** jako jeden screenshot mockup. Formát self-contained — model nemá žádný další kontext.

---

## Promptový text (copy/paste do areny)

```
Navrhni HERNÍ PLOCHU (1 screenshot mockup, 1920×1080) pro indie colony-sim hru
odehrávající se ve vesmíru. Hráč je „Observer" — nezasahuje, sleduje osud
modulární vesmírné lodi která driftuje prostorem.

Obrazovka musí obsahovat tři zóny:

1) HORNÍ LIŠTA — globální metriky
   - Energy (Wh, baterie lodi)
   - Work (Wh, kapacita práce)
   - Solids (materiál pro stavbu/opravy)
   - Fluids (chladiva, provozní média)
   - Health (průměrné HP všech modulů)
   - Game time (herní čas, formát Day X, HH:MM)
   - Každá metrika s barevným ukazatelem (OK / warning / critical)

2) DOLNÍ LIŠTA — ovládání
   Tlačítka: [I]nfo [M]oduly [E]venty [T]asky [Q]uery [H]elp
   Hotkey v hranaté závorce, zbytek písmen jako label.

3) CENTRÁLNÍ PLOCHA — LOĎ (nejdůležitější část, 60 % screenu)

   Loď je MODULÁRNÍ STAVEBNICE složená z obdélníkových dílků
   na grid 8 sloupců × 2 řady (celkem 16 bay pozic):

   - Velikosti modulů: 1×1, 1×2, 2×1, 2×2, 1×3, 1×4
   - Moduly mají různé funkce: energetika, obývání, sklad, zdravotnictví,
     výroba, přístaviště, velení, motor
   - Každý modul je VIZUÁLNĚ ODLIŠENÝ — jinou barvou, tvarem, ikonou,
     glyphem, nebo kombinací
   - Stav modulu: online / poškozený / offline / staví se / demoluje se
     musí být na první pohled čitelný
   - Prázdné pozice (void bays) = jasné kde lze přidat modul
   - V UI musí být patrné akce: PŘIDAT MODUL, UPGRADOVAT, ODSTRANIT

Další mini-prvky (volitelné, pokud zbyde místo):
   - Plovoucí panel (Info nebo Task Queue) otevřený na kraji — ukaž, že
     hra má víc vrstev UI
   - Timeline / event log proužek
   - Dekorativní prvek dokreslující atmosféru

═══════════════════════════════════════════════════════════════════

STYL — doporučení, ne povinnost. Vyber si jeden směr nebo mixuj:

   • Neonový hologram / CRT projekce — cyan, magenta, amber na černé,
     scanline efekt, glow kolem linek, vše vypadá jako telemetrie
     na skleněném displayi
   • Blueprint / technický výkres — thin lines na papíru/modrém pozadí,
     měření, kóty, call-outs, archivní estetika
   • Data-viz / Tufte minimalismus — každý modul jako micro-chart
     (HP trend × čas), čísla dominují nad grafikou
   • Cyberpunk dashboard — chromatic aberration, glitch artifacts,
     synthwave palette, asymetrie
   • Něco svého originálního — překvap mě

ANTI-VZORY (čeho se VYHNOUT):
   • Realistická NASA-style loď ve scéně vesmíru (to je klišé)
   • Chris Foss / Peter Elson painterly space opera (retro rip-off)
   • Generic sci-fi UI s borders a fake-brushed-metal
   • Minecraft-like low-poly
   • Anime/manga maskoti

Důraz: ORIGINALITA + MODERNÍ WEB FRAMEWORK feel (jako by to bylo renderované
WebGL shaderem, ne fotkou lodi). Pokud bude výstup statický obraz, ukaž
efekty jako by byly zachyceny v pohybu (motion blur, pulse, glitch frame).

Výstup: jeden mockup screenshot, orientace landscape, 1920×1080 nebo vyšší.
```

---

## Jak brief používat

1. Otevři arena.ai (nebo jinou platformu co nechá soutěžit modely vedle sebe)
2. Zkopíruj prompt výše do zadání
3. Nechej aspoň 3-5 modelů konkurovat (GPT-4o / Claude Opus / Gemini / Imagen 4 Ultra / Grok Imagine / Midjourney…)
4. Piped modely ukáží varianty — vyber 1-3 nejsilnější kandidáty
5. Vítěze přenes do `art/arena_winners/` a odtud se rozhodujeme o implementaci

## Čeho si všímat při hodnocení

- **Čitelnost lodi** — vidím 8×2 grid a stavebnici? Rozpoznám 8 různých modulů?
- **Originalita** — ne čtený 100× klišé
- **Realizovatelnost** — dá se to postavit WebGL shaderem + Phaser.Graphics, nebo to vyžaduje ruční sprite work?
- **Konzistence** — všechny tři zóny (header/ship/footer) drží jednu estetiku
- **Affordance** — vidí hráč kde kliknout pro akci (build/upgrade/remove)?

## Co brief NEŘEŠÍ (schválně)

- Přesnou paletu (jen doporučený směr) — at modely navrhnou
- Přesný tvar modulů — at je výsledek kreativní, ne mechanický
- Font — at si model vybere, co stylu sedí
- Narrative tón — brief je čistě vizuální, narrative tón (suchý tech / QM persona) se aplikuje až v event textech

## Next step (po vítězi)

Pokud některý výstup **zaujme**: ručně rozebrat styl, identifikovat 2-3 klíčové vizuální prvky (paleta + efekt + skladba), napsat **implementační plán** jak to postavit v Phaseru bez LOC nadkritiky:
- Procedural (Phaser.Graphics + shader) = ano
- PNG asset pipeline = jen pokud naprosto nutné
- LOC cíl: ≤500 LOC pro celou vizuální vrstvu
