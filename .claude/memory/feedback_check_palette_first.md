---
name: Vždy použít 16-color paletu
description: Nikdy hex literály — vždy sémantické konstanty z palette.ts. 16-color axiom.
type: feedback
---

Nikdy nepoužívej hex literály (`#ffffff`, `0xff8800`, ...) přímo v kódu. Vždy sáhni po sémantické konstantě z `palette.ts`.

**Why:** S18 Censure — napsal jsem `"#ffffff"` místo `UI_TEXT_ACCENT`. Porušení 16-color palette axiomu (viz GLOSSARY §Art Pipeline). Opakovaná chyba → regression memory.

**How to apply:** Před zápisem jakékoli barvy do kódu otevři `palette.ts` a najdi odpovídající sémantický slot. Pokud neexistuje, navrhni nový slot — nikdy inline hex.
