---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.ts"
---

# Component Patterns

## File Structure

1. Imports
2. Props interface (with JSDoc on non-obvious props)
3. Component (with JSDoc above)
4. Helper functions

## State Management

- `useState` for local UI state (row hover, breakdown tab selection, load-more offset, control inputs before they're committed to the URL).
- Zustand for shared filter state — sector, sort, and search — kept URL-synced so a filtered Board is linkable. Anything spanning components lives in the store, not prop-drilled. React Router owns the four screens (Board / Company / Market / About); scroll to top on navigation.
- `useMemo` for derived values computed client-side from what the API returns: momentum glyph + label from `direction`, chart bar geometry (trajectory, market index, sector and work-mix bars), remote-share percent, and the "N of 14" gating copy. Never request extra columns or endpoints for values you can derive.

## Data Fetching

- `use*` hooks own fetch + loading/error state for each endpoint (`/api/board`, `/api/companies/:slug`, `/api/market`, `/api/meta`). Company detail is fetched per route by slug.
- Every fetch hook guards against a stale response with a **cancelled flag** in its effect — set `let cancelled = false`, bail on `cancelled` before calling `setState`, and return `() => { cancelled = true }` so a fast filter change or route switch can't apply an out-of-order result.
- Changing sector, search, or sort resets pagination (offset back to 0). Paginate the Board with "load more".
- Every fetch hook surfaces loading, empty, and error states. Distinguish **day-zero** (`updatedAt: null`, tracking just started) from the **gated-trend** state (`gated: true`, "trend building — N of 14") — they are different designed UIs, never a blank screen.

## Limits

- Components under 150 lines. Extract sub-components or hooks beyond that.
- Extract hooks when logic exceeds ~20 lines or is reused.
