---
name: Ukazatel a jeho barva sdílí metriku
description: UI ukazatel s barvou (semafor) musí barvu odvozovat ze stejné hodnoty, kterou zobrazuje. Nevytvářet disconnect "displej říká X, barva říká Y" kvůli technickým workaroundům.
type: feedback
---

UI ukazatel (číslo/bar) a jeho barva (semafor `RATING_COLOR[statusRating(pct)]`) musí sdílet zdrojovou metriku. Když bar ukazuje „0/23", barva musí být červená. Žádný disconnect.

**Why:** V S24 jsem Top Bar W ukazatel přepnul na availability/max (0/23 při práci dronů), ale semafor barvy nechal na metrice „plnost baterek" (stabilní 100%), abych zabránil flappingu Protokolu (cyklus active → 0 avail → pause → 100 → resume). User dal **Censure!** — UI disconnect je nepřípustný, ukazatel 0/23 zelenou barvou je lež pro hráče. Správné řešení: oddělit Protocol gate od semaforu (Protocol používá E rating + kapacitní check „máme fyzicky kdo pracovat", ne W rating). Semafor sleduje pravdu.

**How to apply:** Když navrhuji UI prvek, který má zároveň **hodnotu** i **barvu stavu**, drž oba ze stejného výpočtu. Pokud technický problém (flapping, performance, race) tlačí k oddělení, najdi **jiné** řešení než rozpojit UI:
- Oddělit controller logiku od UI (jako v S24: Protocol gate ≠ semafor rating).
- Přidat hysterezi / debounce v controlleru, ne v UI.
- Přesunout responsibilityou — UI vždy odráží pravdu.
