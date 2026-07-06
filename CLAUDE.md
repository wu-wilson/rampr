# CLAUDE.md — rampr

## What This Is

rampr is a public, read-only hiring-momentum board with a light, editorial visual language. It polls a curated set of companies' public ATS feeds (Greenhouse / Lever / Ashby) once a day, counts the open roles on each company's own board, and writes one open-count snapshot per company per day. Four routed screens: **Board** (an editorial headline paired with market stat notes, over the ranked leaderboard), **Company** (current count, department / location / remote breakdown, and a trajectory chart), **Market** (open roles by sector + the market hiring index over time + heating/cooling movers), and **About** (methodology). The thesis: rampr never editorializes — it counts what's on the board and presents the number and its trend as facts. Snapshot data is full on day one; trend data is gated until enough daily history accrues.

## Architecture

- **client/** — React 18 + Vite + TypeScript (strict). Tailwind CSS v3. Zustand for filter state (sector / sort / search, URL-synced). React Router for the four screens. All momentum glyphs, gating states, and chart geometry are derived client-side from what the API returns. The two daily time-series charts (company trajectory, market index) use `d3-scale` for geometry (`scaleBand` / `scaleLinear` / `scaleTime` + axes) with React rendering the SVG; the work-mix and sector bars stay hand-rolled CSS. No charting/rendering library (Recharts, Chart.js, full d3) and no UI component libraries.
- **server/** — Express + TypeScript (strict). pg + pg-pool for Postgres. Zod validation at every boundary. Thin route files (`/api/board`, `/api/companies/:slug`, `/api/market`, `/api/meta`, `/api/health`) over `listings` (live open set) and `daily_snapshots` (the time series). Parameterized queries only; per-IP rate limiting on reads; CORS allowlist via env. Serves nothing but JSON — the client is a separate static build.
- **cron-poller/** — TypeScript Node worker. One adapter per ATS, a per-run orchestrator with an inline concurrency limiter, and normalization. Runs as a one-shot `npm start`, reconciles each company's feed into `listings` and writes its `daily_snapshots` row in a single transaction per company, and `process.exit(0/1)`. No HTTP surface. Deployed as a Railway daily cron.
- **cron-cleanup/** — TypeScript Node worker. Deletes `daily_snapshots` older than `RETENTION_DAYS` (90), then exits. Deployed as a Railway weekly cron.

## Key Decisions

- **Curated seed list.** ATS feeds don't advertise themselves or carry a sector, so the tracked companies (name, slug, sector, provider, board token) are seeded in `schema.sql`. Adding a company is a seed insert, not a discovery step.
- **Forward-only snapshots, no backfill.** History accrues from the day tracking started — a per-company daily open-count row. There is no historical backfill; trend views start empty and fill over time. Trend surfaces (trajectory chart, momentum, market index, movers) are **gated until 14 daily snapshots exist**; snapshot counts (open now, breakdowns, sector totals) are live from day one.
- **One posting = one open role.** rampr counts each posting on a board as one open role — no title-based dedup, no editorial judgement about what "a role" is. Counting postings as-is keeps every number on the page internally consistent (the headline count equals the sum of the breakdowns).
- **`listings` is the live open set only.** The poller upserts the roles present in a feed and **hard-deletes** the ones that have left. No role history is kept in `listings` — the trend lives entirely in `daily_snapshots`. A role's open count is `COUNT(listings)`; there is no `is_open` flag and no closed rows.
- **Failed-fetch guard.** If a company's feed fetch fails (network error, non-2xx, or unparseable), the poller skips that company's reconcile and snapshot so an ATS outage can never wipe `listings` or write a bogus count. A feed that *successfully* returns zero roles is a real observation and is recorded as an open count of `0` (counts are meaningful at every value).
- **Everything else is derived.** Open now and the department/location/remote breakdowns come live from `listings`; momentum, gating, the market index, and movers are computed from `daily_snapshots`. No aggregate state, no views, and no heartbeat table — "last updated" is `MAX(snapshot_date)`.
- **Rolling 90-day window.** `cron-cleanup` prunes `daily_snapshots` past 90 days, which is exactly the deepest the trajectory/index charts ever render — so nothing visible is lost. `listings` self-trims every poll and needs no cleanup.
- **UTC everywhere.** The poller's "today" and the DB's `CURRENT_DATE` (snapshot date + retention math) must agree — both pinned to UTC.
- **Two Railway crons.** Each cron is a Railway service purely because `deploy.cronSchedule` is set; each boots, runs once, and exits. `restartPolicyType: "NEVER"`.

## Do NOT

- Add accounts, authentication, or any AI — rampr is a read-only public board.
- Backfill history or invent snapshots for days before tracking began — the time series is forward-only.
- Dedup, reweight, or otherwise editorialize the count — one posting is one open role, presented as a fact.
- Let a *failed* feed fetch reconcile or snapshot — an outage must never wipe `listings` or write a bogus count (a successful feed of zero roles, though, is a genuine `0` and is recorded).
- Write test files or install testing libraries (TypeScript `strict` is the only linter).
- Use `any`, `as` casts (unless unavoidable), or default exports (exception: lazy-loaded route components).
- Use UI component libraries (MUI, Chakra, Radix, shadcn) or a charting/rendering library (Recharts, Chart.js, full d3). `d3-scale` is allowed for chart math only — React always renders the SVG. Otherwise build from scratch with Tailwind and CSS.
- Hardcode hex colors in component files — use Tailwind semantic tokens mapped from CSS custom properties. Light, warm-paper theme; no dark mode, no theme toggle.
- Allow horizontal overflow on any screen, or use `h-screen` / `min-h-screen` — use `min-h-dvh`.
- Show blank screens — every state (loading, empty, day-zero before the first poll, not-found, gated trend) must have designed UI.
- Signal status by color alone — momentum always pairs a glyph (`↗ ↘ →`) and text with its color.
- String-concatenate input into SQL — use parameterized queries (`$1`, `$2`).
- Leak raw upstream/pg errors to the client — gate client-visible messages behind an `isPublic` flag.

## Rules (path-scoped — loaded automatically when editing matching files)

- `.claude/rules/code-style.md` — TypeScript, JSDoc, import ordering, naming, error handling. Loads for `client/**/*.{ts,tsx}`, `server/**/*.ts`, `cron-poller/**/*.ts`, and `cron-cleanup/**/*.ts`.
- `.claude/rules/component-patterns.md` — React file structure, state management, derived values. Loads for `client/src/**/*.{ts,tsx}`.
- `.claude/rules/styling.md` — Theming, visual language, interactive states, animation. Loads for `client/src/**/*.{tsx,css}` and `client/tailwind.config.js`.
- `.claude/rules/responsive.md` — Mobile-first breakpoints, the ultra-wide rail, viewport units, safe-area handling. Loads for `client/src/**/*.{tsx,css}`.
- `.claude/rules/server-patterns.md` — Route handlers, Zod validation, service layer, security hardening. Loads for `server/src/**/*.ts`.

## Skills (reference knowledge)

- `.claude/skills/design-tokens/` — Exact color tokens, fonts, the paper texture, animation durations, the ultra-wide rail.
- `.claude/skills/data-model/` — The four tables, how each board/company/market number is derived, gating, momentum, remote share, and the JSON contract for every endpoint.
- `.claude/skills/ats-feeds/` — Greenhouse / Lever / Ashby public endpoints, fields, quirks, and remote-type inference (Workday intentionally not implemented).
