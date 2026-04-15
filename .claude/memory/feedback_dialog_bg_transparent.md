---
name: UI boxy mají transparentní pozadí
description: Všechny UI boxy/dialogy musí mít transparentní pozadí (alpha), nikdy solid fill.
type: feedback
---

Všechny UI boxy mají transparentní pozadí — ladíme alpha per-box typ. Nikdy solid fill.

**Why:** S19 Censure — pozadí dialogů bylo solid (stejná barva jako canvas), hvězdy nebyly vidět skrz. User vyhlásil axiom ihned po zápisu UI Layer Stack axiomu.

**How to apply:** Při vytváření jakéhokoli UI panelu/dialogu/overlay: `bg.setAlpha(...)`. Aktuální hodnoty: panel 0.9, overlay 0.25. Pozadí = `COL_HULL_DARK` (`#1a1e28`), ne `COL_VOID_BLACK` (ta je stejná jako canvas → alpha nemá kontrast). Border = `setStrokeStyle()` na bg rect, nikdy samostatný solid border rect pod bg.
