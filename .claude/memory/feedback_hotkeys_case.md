---
name: Case-insensitive hotkeys
description: Hotkeys musí fungovat bez ohledu na CapsLock / Shift — vždy case-insensitive.
type: feedback
---

Hotkeys musí být case-insensitive. `[E]` musí reagovat na `e` i `E`.

**Why:** User reportoval, že hotkey nefunguje s CapsLock. Princip: hráč nemá přemýšlet nad stavem klávesnice.

**How to apply:** V `bindDebugKeys` a kdekoli jinde kde se testuje `event.key`: vždy `.toLowerCase()` před porovnáním. Nikdy netestovat přímo `event.key === "E"`.
