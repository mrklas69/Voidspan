---
name: HP ratio axiom — výkon × HP/HP_MAX
description: Všechny číselné input/output entity jsou násobeny koeficientem HP/HP_MAX. 100% jen bezvadný.
type: feedback
---

Všechny číselné vstupy i výstupy entit (moduly, aktéři) jsou automaticky násobeny koeficientem **HP / HP_MAX**. Pouze bezvadná entita (100% HP) generuje plný jmenovitý výkon.

**Why:** User vyhlásil axiom v S21. Platí univerzálně — produkce energie, spotřeba, výroba jídla, léčení, práce aktérů.

**How to apply:** Kdekoli se čte `power_w`, produkce, spotřeba, nebo jiný číselný výstup entity — vždy násobit `hp / hp_max`. Nikdy nepoužívat jmenovitou hodnotu přímo.
