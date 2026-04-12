# CLAUDE.md — Voidspan

Projektové instrukce. Rozšiřují globální `~/.claude/CLAUDE.md`.

## Macros

### `@BEGIN` — začátek sezení
1. `git pull` (pokud existuje remote)
2. Připomeň si feedback systém **Kudos!/Censure!** a kritickou úroveň **8/10** (memory: `feedback_kudos_censure.md`)
3. Přečti poslední záznam v `.claude/sessions/` pro kontext předchozího sezení
4. Zkontroluj `TODO.md` a `IDEAS.md` (pokud existují)
5. Přečti `MINDMAP.md` — aktuální mapa projektu s vyznačeným fokusem
6. Stručně shrň aktuální stav projektu a navrhni, kde navázat

### `@END` — konec sezení
1. Zapiš shrnutí sezení do `.claude/sessions/YYYY-MM-DD.md`
   - Pokud soubor už existuje, připoj novou sekci (jeden soubor = všechna sezení daného dne)
2. Přesuň hotové úkoly z `TODO.md` do `DONE.md` (pokud existují)
3. Aktualizuj `MINDMAP.md` — stavy uzlů `[○/◐/●]`, přidej/přejmenuj uzly, posuň fokus
4. `git add -A` + `git commit` se smysluplnou zprávou (navrhni a použij bez schválení, spolupodpis Claude)
5. `git push`

## Sessions log
- Cesta: `.claude/sessions/YYYY-MM-DD.md`
- Jeden soubor za den, víc sezení = víc sekcí v témže souboru
- Zapisuje se jen na `@END`, ne průběžně
