# Sdílená memory — ⊙ Voidspan

Feedback a konvence sdílené přes git mezi stroji. Strojově-specifický kontext zůstává v `~/.claude/projects/.../memory/`.

## Feedback

- [Kudos!/Censure! systém](feedback_kudos_censure.md) — duální feedback, kritičnost 8/10
- [16-color paleta](feedback_check_palette_first.md) — nikdy hex literály, vždy palette.ts
- [Transparentní UI boxy](feedback_dialog_bg_transparent.md) — alpha per-typ, nikdy solid fill
- [Asset delete = grep + námitka](feedback_asset_delete_check.md) — grep references, namítnout pokud core vizuál
- [Font preload](feedback_font_preload.md) — document.fonts.load před Phaser.Game
- [Case-insensitive hotkeys](feedback_hotkeys_case.md) — vždy .toLowerCase()
- [Číslované otázky](feedback_numbered_questions.md) — Q1, Q2... ne bullety
- [HP ratio axiom](feedback_hp_ratio_axiom.md) — výkon × HP/HP_MAX, 100% jen bezvadný
- [Event = věta](feedback_event_is_sentence.md) — kdo/co/kdy/kde/kolik, žádné abstraktní statusy
