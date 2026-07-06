# public/assets

`grain.png` is a binary asset provided separately (not committed by the client
scaffolding). It is a subtle, seamless, low-contrast paper-grain tile referenced by the
`.app-surface` rule in `src/index.css` via `background-image: url('/assets/grain.png')`.

Keep it faint enough that it never reduces text contrast. Until the file is dropped in,
the app surface simply renders as flat `bg-paper` — nothing breaks.
