---
name: Code English / display Czech (target EN)
description: Conventions for naming in code vs. player-facing UI. Code identifiers in English, display strings Czech for FVP/playtest s českými blízkými, target final language = English.
type: feedback
---

**Code:** všechny identifikátory v angličtině — proměnné, funkce, typy, enum hodnoty, soubory, identifikátory konstant. Komentáře v češtině jsou OK (autorská poznámka, designové vysvětlení).

**Display strings (UI):** zatím česky — tooltip headery, monitor labely, event texty, panel obsah. Cílový jazyk aplikace bude **angličtina** (P2+ lokalizace).

**Why:** Hra cílí na anglicky mluvící publikum (zaměřeno na vesmírnou kolonii / sci-fi crowd). Český display je dočasný proto, že FVP testují **česky mluvící blízcí autora** (P1–P4 playtest, viz MINDMAP §1.1). Code v angličtině zaručuje přechod na anglický UI bez refactoru identifikátorů.

**How to apply:**
- Při psaní nového kódu: identifikátory EN (`solidsTooltip`, `noMaterial`, `RECIPE_MIN_HP_EPSILON`).
- Display strings (texty co se ukazují hráči): zatím CZ.
- Existující CZ identifikátory (typu `noSlab` před S25 rename): při dotyku přejmenovat na EN ekvivalent.
- Při P2+ přechodu na EN UI: locale layer s `t("paused.no_material")` patternem.
