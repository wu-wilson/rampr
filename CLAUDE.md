# CLAUDE.md — rampr

## What This Is

rampr is a public, read-only hiring board presented as a daily statistical release: white paper, ink, hairlines, light headings, titled tables and charts. It polls a curated set of companies' public ATS feeds (Greenhouse / Lever / Ashby) once a day at 08:00 UTC (a "release"), counts the open postings on each company's own board, and writes one open-count snapshot per company per day. Four routed screens: **Board** (the lead figure with its 1/7/30/90-day changes beside the hero chart on a ruled hero band, the companies strip, and the company table with sortable columns), **Company** (the lead sentence and figure, a facts row, the company chart and the last seven releases, and the department / location / work arrangement breakdowns), **Market** (the full series, breadth per release, postings by sector, and the largest seven-day changes), and **Method** (at `/about`, the methodology). The thesis: rampr never editorializes — it counts what's on the board and presents the number and its change as facts. Snapshot data is full on day one; trend data is gated until 14 releases accrue.

## Architecture

- **client/** — React 18 + Vite + TypeScript (strict). Tailwind CSS v3. Zustand for shared state: the company table's sector / sort / search (URL-synced) and the release stamp (`metaStore`). React Router for the four screens. The board is fetched whole and sorted and filtered locally. Change figures, gating states, series highs and lows, and chart geometry are derived client-side from what the API returns. The line charts and the breadth chart use `d3-scale` for the value axis (`lib/chart.ts`) with React rendering the SVG; the sector bars are CSS. Switzer is self-hosted from `public/fonts`; company marks are hardcoded PNGs in `public/marks/<slug>.png`. No charting/rendering library (Recharts, Chart.js, full d3) and no UI component libraries.
- **server/** — Express + TypeScript (strict). pg for Postgres, using its built-in pool. Zod validation at every boundary. Thin route files (`/api/board`, `/api/companies/:slug`, `/api/market`, `/api/meta`) over `listings` (live open set) and `daily_snapshots` (the time series). Parameterized queries only; per-IP rate limiting on reads; CORS allowlist via env. Serves nothing but JSON — the client is a separate static build.
- **cron-poller/** — TypeScript Node worker. One adapter per ATS, a per-run orchestrator with an inline concurrency limiter, and normalization. Runs as a one-shot `npm start`, reconciles each company's feed into `listings` and writes its `daily_snapshots` row in a single transaction per company, and sets its exit code (0/1). No HTTP surface. Deployed as a Railway daily cron.
- **cron-cleanup/** — TypeScript Node worker. Deletes `daily_snapshots` more than `RETENTION_DAYS` (90) plus one day behind the latest release, then exits. Deployed as a Railway weekly cron.

## Key Decisions

- **Curated seed list.** ATS feeds don't advertise themselves or carry a sector, so the tracked companies (name, slug, sector, provider, board token) are seeded in `schema.sql`. Adding a company is a seed insert, not a discovery step.
- **Forward-only snapshots, no backfill.** History accrues from the day tracking started — a per-company daily open-count row. There is no historical backfill; trend views start empty and fill over time. Trend surfaces (trajectory chart, changes, market index, breadth, movers) are **gated until 14 daily snapshots exist**; snapshot counts (open now, breakdowns, sector totals) are live from day one.
- **One posting = one open role.** rampr counts each posting on a board as one open role — no title-based dedup, no editorial judgement about what "a role" is. Counting postings as-is keeps every number on the page internally consistent (the headline count equals the sum of the breakdowns).
- **`listings` is the live open set only.** The poller upserts the roles present in a feed and **hard-deletes** the ones that have left. No role history is kept in `listings` — the trend lives entirely in `daily_snapshots`. A role's open count is `COUNT(listings)`; there is no `is_open` flag and no closed rows.
- **Failed-fetch guard.** If a company's feed fetch fails (network error, non-2xx, or unparseable), the poller skips that company's reconcile and snapshot so an ATS outage can never wipe `listings` or write a bogus count. A feed that *successfully* returns zero roles is a real observation and is recorded as an open count of `0` (counts are meaningful at every value).
- **Everything else is derived.** Open now and the department/location/work-arrangement breakdowns come live from `listings`; changes, gating, the market index, breadth, and movers are computed from `daily_snapshots`. No aggregate state, no views, and no heartbeat table — "last updated" is `MAX(snapshot_date)`.
- **Rolling 90-day window.** `cron-cleanup` prunes `daily_snapshots` more than 91 days behind the latest release, the same anchor every read query counts back from, keeping one day of slack past the 90-day window so a 90-day change survives a missed morning. `listings` self-trims every poll and needs no cleanup.
- **UTC everywhere.** The poller's "today" is the snapshot date, and every read window and the retention boundary count back from the latest snapshot date, all pinned to UTC. The client formats every release date in UTC too, so no viewer sees a release land on a different day.
- **Two Railway crons.** Each cron is a Railway service purely because `deploy.cronSchedule` is set; each boots, runs once, and exits. `restartPolicyType: "NEVER"`.
- **No canonical or `og:url`.** Every route shares the one `client/index.html`, so a static value would declare `/company/*`, `/market`, and `/about` duplicates of the board and drop them from search. `sitemap.xml` lists the static routes only — company URLs stay out so the seed list never couples to a hand-kept file.

## Do NOT

- Add accounts, authentication, or any AI — rampr is a read-only public board.
- Backfill history or invent snapshots for days before tracking began — the time series is forward-only.
- Dedup, reweight, or otherwise editorialize the count — one posting is one open role, presented as a fact.
- Let a *failed* feed fetch reconcile or snapshot — an outage must never wipe `listings` or write a bogus count (a successful feed of zero roles, though, is a genuine `0` and is recorded).
- Write test files or install testing libraries (TypeScript `strict` is the only linter).
- Use `any`, `as` casts (unless unavoidable), or default exports.
- Use UI component libraries (MUI, Chakra, Radix, shadcn) or a charting/rendering library (Recharts, Chart.js, full d3). `d3-scale` is allowed for chart math only — React always renders the SVG. Otherwise build from scratch with Tailwind and CSS.
- Hardcode hex colors in component files — use Tailwind semantic tokens mapped from CSS custom properties. Light, white-paper theme with no brand colour; no dark mode, no theme toggle. No shadows, gradient fills, pills, or chips, and no radius beyond the 4px on the company marks.
- Add a font from Google Fonts or a second typeface — one self-hosted sans stack.
- Put an em dash, a middle dot, or a semicolon in anything the viewer reads.
- Allow horizontal overflow on any screen, or use `h-screen` / `min-h-screen` — use `min-h-dvh`.
- Show blank screens — every state (loading, empty, day-zero before the first poll, not-found, gated trend) must have designed UI.
- Signal a change by color alone — a change is a signed figure (`+34`, `−22` with a true minus, a grey `0`) whose sign carries the direction; color reinforces, and the direction word is the hover title. No arrows or triangles.
- String-concatenate input into SQL — use parameterized queries (`$1`, `$2`).
- Leak raw upstream/pg errors to the client — gate client-visible messages behind an `isPublic` flag.

## Rules (path-scoped — loaded automatically when editing matching files)

- `.claude/rules/code-style.md` — TypeScript, JSDoc, import ordering, naming, error handling. Loads for `client/**/*.{ts,tsx}`, `server/**/*.ts`, `cron-poller/**/*.ts`, and `cron-cleanup/**/*.ts`.
- `.claude/rules/component-patterns.md` — React file structure, state management, derived values. Loads for `client/src/**/*.{ts,tsx}`.
- `.claude/rules/styling.md` — Theming, visual language, interactive states, animation. Loads for `client/src/**/*.{tsx,css}` and `client/tailwind.config.js`.
- `.claude/rules/responsive.md` — Mobile-first breakpoints, the ultra-wide rail, viewport units, safe-area handling. Loads for `client/src/**/*.{tsx,css}`.
- `.claude/rules/server-patterns.md` — Route handlers, Zod validation, service layer, security hardening. Loads for `server/src/**/*.ts`.

## Skills (reference knowledge)

- `.claude/skills/design-tokens/` — Exact color tokens, the typeface, animation durations, the rail and full-bleed regions.
- `.claude/skills/data-model/` — The four tables, how each board/company/market number is derived, gating, changes, work mix, and the JSON contract for every endpoint.
- `.claude/skills/ats-feeds/` — Greenhouse / Lever / Ashby public endpoints, fields, quirks, and remote-type inference (Workday intentionally not implemented).
