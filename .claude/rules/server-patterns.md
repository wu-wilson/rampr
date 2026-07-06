---
paths:
  - "server/src/**/*.ts"
---

# Server Patterns

## Routes

- One route handler per file under `server/src/routes/` (`board.ts`, `company.ts`, `market.ts`, `meta.ts`, `health.ts`), each mounted under `/api`.
- Validate every input with Zod before business logic — query params on `/api/board` (`sector` slug or omitted, `q` search, `sort` ∈ `open|momentum`, `limit`, `offset`) and the `:slug` on company detail.
- SQL/business logic in `server/src/services/` (`db.ts` owns the pool + query helpers), not in handlers.
- Single tail error-handling middleware in `middleware/errorHandler.ts`.

## API semantics

- `/api/board` reads `listings` (live open set) joined to `companies`; open now = `COUNT(listings)`, never the latest snapshot. Returns `{ market, companies, total, updatedAt }` — `total` = matching companies for load-more. Momentum is the 7d `delta` + `direction` from the snapshot on-or-before `CURRENT_DATE − 7`, `null` when gated.
- `/api/companies/:slug` and `/api/market` are read-only aggregates over `listings` + `daily_snapshots`; `/api/meta` returns just the last-updated stamp for the nav. `updatedAt` = `MAX(snapshot_date)` as an ISO date, or `null` before the first poll (client shows day-zero).
- **Gating** mirrors `GATING_DAYS = 14` (keep the constant in sync with the client). Trend fields (trajectory, market index, movers) return `gated: true` with empty `points` / `null` deltas; snapshot fields (open, breakdowns, sector totals) are never gated.

## Security

- `app.set('trust proxy', 1)` — Railway is one hop, so `req.ip` resolves to the real client (required for per-IP rate limiting). If fronted by Cloudflare, key off `CF-Connecting-IP`.
- No security-header middleware: this is a JSON API and never serves HTML (the client is a separate static build). Set HSTS at the edge if fronted by Cloudflare.
- Per-IP read rate limit via `express-rate-limit` (in-memory), `config.readRateLimitPerHour` across the GET endpoints.
- CORS allowlist via `config.allowedOrigins` (comma-separated env, `*` in dev).
- **Never leak raw upstream/pg error messages.** `errorHandler` only echoes `err.message` when the thrown error carries `isPublic: true`; everything else becomes "Internal server error". Don't include Zod issue paths or pg wording in client responses.

## Database

- Parameterized SQL queries (`$1`, `$2`) — never string-concatenate input.
- `pg-pool` (`max: 10`), release in `finally` blocks.
- Graceful degradation: if Postgres is unreachable, read endpoints return **503** (and `/api/health` reports the outage) rather than throwing an opaque 500.
- All date/age math is **UTC** — `CURRENT_DATE` and the poller's "today" must agree.

## Environment

- Env vars read once at startup into a typed `config` object (`PORT`, `DATABASE_URL`, `ALLOWED_ORIGINS`, `READ_RATE_LIMIT_PER_HOUR`).
- Log request outcome on each request. Never log full payloads, connection strings, or headers.
