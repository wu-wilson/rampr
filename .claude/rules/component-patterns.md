---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.ts"
---

# Component Patterns

## File Structure

1. Imports
2. Constants, helper functions, and subcomponents (each subcomponent's Props interface directly above it, unless it reuses the component's own)
3. Props interface (with JSDoc on non-obvious props)
4. Component (with JSDoc above)

## State Management

- `useState` for local UI state (the search draft before it commits, "show all" expansion, the chart range and its crossfade, a mark that failed to load). `useMediaQuery` for the one layout decision CSS can't make, the breadth chart's phone window.
- Zustand for state shared across components: the company table's sector, sort (column + direction), and search, kept URL-synced (`useFilterUrlSync`) so a filtered or sorted board is linkable, and the release stamp (`metaStore`), which the masthead and the Method page both read. Anything spanning components lives in the store, not prop-drilled. React Router owns the four screens (Board / Company / Market / Method at `/about`); scroll to top on navigation.
- `useMemo` for derived values computed client-side from what the API returns: the ordered and filtered rows of the company table, the sector options (from the board rows), a series' 90-day high and low (`seriesExtremes`), and chart geometry off the measured container (`lib/chart.ts`). Never request extra fields or endpoints for values you can derive.

## Data Fetching

- `use*` hooks own fetch + loading/error state for each endpoint (`/api/board`, `/api/companies/:slug`, `/api/market`, `/api/meta`). Company detail is fetched per route by slug; `useMeta` reads the shared meta store, which fetches once and retries a failed load on navigation.
- Every per-screen fetch hook (`useBoard`, `useCompany`, `useMarket`) guards against a stale response with a **cancelled flag** in its effect — set `let cancelled = false`, bail on `cancelled` before calling `setState`, and return `() => { cancelled = true }` so a route switch can't apply an out-of-order result.
- The Board fetches the whole board once (`limit=BOARD_LIMIT`, no sector, search, or sort params) and reorders and narrows it locally, so rows can slide to their new places. There is no pagination; the company table shows 15 rows until expanded.
- Every fetch hook surfaces loading, empty, and error states. Distinguish **day-zero** (`updatedAt: null`, before the first release) from the **gated** state (`gated: true`, `GatedPanel`) — they are different designed UIs, never a blank screen. A company no release has read yet (no snapshot and no open postings) gets its own "Not counted yet" state rather than a count of zero.

## Motion hooks

- Section reveals go through `Reveal` (a wrapper) and `useRevealPhase` (context) rather than per-component observers. FLIP reorders go through `useFlipReorder` on the rows container; sliding underlines through `useSlidingIndicator`; the hero's snapping through `useSnapToRules`; the ledger wave through `useRuleWave`. Do not add ad hoc `animate()` calls in components.

## Limits

- Components under 150 lines. Extract sub-components or hooks beyond that.
- Extract hooks when logic exceeds ~20 lines or is reused.
