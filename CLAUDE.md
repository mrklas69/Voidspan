# CLAUDE.md — ⊙ Voidspan

Projektové instrukce. Rozšiřují globální `~/.claude/CLAUDE.md`.

## Macros

### `@BEGIN` — začátek sezení
1. `git pull` (pokud existuje remote)
2. Přečti `.claude/memory/MEMORY.md` — sdílené feedback soubory (přenášejí se přes git mezi stroji)
3. Přečti poslední záznam v `.claude/sessions/` pro kontext předchozího sezení
4. Zkontroluj `TODO.md` a `IDEAS.md` (pokud existují)
5. Přečti `MINDMAP.md` — aktuální mapa projektu s vyznačeným fokusem
6. Stručně shrň aktuální stav projektu a navrhni, kde navázat
7. Spusť `pnpm dev` na pozadí (dev server pro lokální vývoj)

### `@END` — konec sezení
1. Zapiš shrnutí sezení do `.claude/sessions/YYYY-MM-DD.md`
   - Pokud soubor už existuje, připoj novou sekci (jeden soubor = všechna sezení daného dne)
2. Přesuň hotové úkoly z `TODO.md` do `DONE.md` (pokud existují)
3. Aktualizuj `MINDMAP.md` — stavy uzlů `[○/◐/●]`, přidej/přejmenuj uzly, posuň fokus
4. **Konsoliduj `.claude/settings.local.json`** — prošlé granulární allow entries (např. `Bash(pnpm install:*)`, `Bash(pnpm test:*)`, ...) nahraď širšími wildcardy (`Bash(pnpm:*)`). Cíl: míň approve proceduralních příkazů v dalším sezení. Viz aktuální stav souboru jako referenci — konsolidace NENÍ kreativní, jen sjednocující.
5. `git add -A` + `git commit` se smysluplnou zprávou (navrhni a použij bez schválení, spolupodpis Claude)
6. `git push`

## Design principy

Platí pro kód i design. Detail v IDEAS.md T3 a MINDMAP §7.5.

- **KISS** — nejjednodušší funkční řešení. Pro adaptivní/responzivní UI začni fix hodnotami + center/reposition; min/max/lerp/breakpointy přidávej až na explicit žádost.
- **DRY** — jeden zdroj pravdy per koncept. Když se duplikuje hodnota nebo logika, extrahuj.
- **SLAP** — jedna funkce, jedna úroveň abstrakce.
- **Izomorfismus** — stejný vizuál / stejná mechanika = stejná sémantika (viz damage overlay, status semafor).
- **Foundations before curtains** — základy před detaily. Model-first: nejdřív datový model, pak UI projekce.

## Sessions log
- Cesta: `.claude/sessions/YYYY-MM-DD.md`
- Jeden soubor za den, víc sezení = víc sekcí v témže souboru
- Zapisuje se jen na `@END`, ne průběžně
