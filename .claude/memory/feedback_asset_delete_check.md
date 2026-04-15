---
name: Před smazáním assetu grep + námitka
description: Před smazáním jakéhokoli assetu grep references a aktivně namítni, pokud je core gameplay vizuál.
type: feedback
---

Před smazáním jakéhokoli assetu (PNG, audio, font, ...): **grep references v kódu** + **aktivní námitka**, pokud asset tvoří core gameplay vizuál.

**Why:** S14 Censure — user požádal o smazání `floor_damaged.png`, souhlasil jsem s odvoláním na `textures.exists()` fallback. Fallback jen SKRYL sprite → damaged tile nerozlišitelná od empty → core P1 loop nehratelný. User: „čekal jsem námitku."

**How to apply:** 1) Grep všechny reference na asset. 2) Posoudit, zda fallback zachovává gameplay smysl, ne jen „nespadne to". 3) Pokud ne — aktivně namítnout, i když user žádá o smazání. Navrhnout alternativní řešení (v tomto případě: HP-unified overlay místo PNG).
