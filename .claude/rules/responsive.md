---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.css"
---

# Responsive Design

## Breakpoints

Mobile-first, with a single primary breakpoint at **~760px** (define it as the Tailwind `md` boundary or a custom screen and use it consistently). Base styles target a phone-width column, then layer the desktop overrides above 760px. (One exception: the Board hero splits headline-left / post-it-cluster-right only at **~1024px** (`min-[1024px]`), since the side-by-side needs more room than 760px; below that it stacks.)

## Ultra-wide rail

- The paper surface (`bg-paper` + grain) fills the viewport; **content and the sectioning hairlines stay in a centered 1280px rail** (`max-w-rail mx-auto`, `rail` = `1280px`). The paper extends past the rail — don't add a border, shadow, or background band to mark its edges.
- Inside the rail, bands and screens carry a consistent horizontal gutter: `px-5` (20px) on mobile, `md:px-10` (40px) on desktop.

## Typography

- Base body 14px (set on `body` in `index.css`), line-height 1.5.
- The Board headline and the big Archivo stat numbers scale up at the desktop breakpoint; mono micro-labels stay small. Never go below `text-xs` (12px) for primary text.

## Layout collapse (≤760px)

- **Stat / market cards** collapse multi-column grids to 1–2 columns.
- **Board rows** reflow from a single desktop grid line into a stacked block, with small uppercase mono micro-labels above each value (rank / company & sector / open / remote % / momentum). The desktop-only column header is hidden on mobile.
- **Company breakdowns** (departments / locations / work mix) and the trajectory chart go from side-by-side to a single stacked column.
- **Controls row** (sector filter, sort, search) stacks vertically.
- The top bar's cadence stamp is **desktop-only**: before the first poll it reads `updated daily · {poll time}`; once `updatedAt` is set it shows the latest snapshot's moment (`updated {date} · {time}`). Both derive from the daily 06:17 UTC poll, rendered in the viewer's local timezone.

## Viewport

- Never use `h-screen` / `min-h-screen` (`100vh`) — use `min-h-dvh` (dynamic viewport).
- `index.html` viewport: `viewport-fit=cover` for notched devices.
- Respect safe-area insets on top/bottom edges (`env(safe-area-inset-*)`); the paper surface fills the insets.
- Never allow horizontal overflow — `overflow-x: hidden` on html.

## States

- Every state has designed UI: loading, empty ("no companies match"), error, **day-zero** ("tracking just started", `updatedAt: null`), and the **gated-trend** state ("trend building — N of 14") — the two empty-ish states are distinct.

## Scrolling

- `overscroll-behavior: none` on body to prevent pull-to-refresh.
- Avoid `overflow-x-auto` on containers holding focus-ring-bearing children — the browser also clips `overflow-y`, cropping rings.
