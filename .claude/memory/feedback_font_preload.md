---
name: Font swap = preload přes document.fonts.load
description: Font swap bug řešit preloadem, ne opravou renderovací metody.
type: feedback
---

Font swap bug (FOUT) se řeší preloadem: `await document.fonts.load(...)` pro všechny velikosti webfontu v `main.ts` PŘED `new Phaser.Game`.

**Why:** S13 Censure — opravoval jsem render metodu místo root cause. Skutečný root cause = async webfont load. Systémový font se zobrazil na první frame, pak přeskočil na webfont.

**How to apply:** Když se objeví vizuální font glitch při startu: hledat root cause v načítání, ne v renderování. `document.fonts.load` je standardní řešení pro webfonty v canvas kontextu.
