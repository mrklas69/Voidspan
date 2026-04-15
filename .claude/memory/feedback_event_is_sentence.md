---
name: Event = lidská věta
description: Event je sdělení s kdo/co/kdy/kde/kolik/čeho. Žádné abstraktní statusy jako samostatné eventy.
type: feedback
---

Event je sdělení, lidská věta: **KDO, CO, KDY, KDE, KOLIK, ČEHO, S KÝM, JAK, PROČ.**

**Why:** STAT event (`status ok → warn (25%)`) neříkal pozorovateli nic užitečného. Změna statusu je důsledek jiného eventu (DECY, DRN, DEAD), ne samostatné sdělení. Status tree se čte přímo z `w.status`.

**How to apply:** Každý event musí být formulovatelný jako věta. Pokud nelze říct kdo to udělal a co se stalo — není to event, je to odvozený stav. Systémové zprávy (BOOT, RPRT) jsou výjimka — ale i ty musí říct CO se stalo.
