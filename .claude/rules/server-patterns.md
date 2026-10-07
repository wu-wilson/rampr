---
paths:
  - "server/src/**/*.ts"
---

# Server Patterns

## Routes

- One route handler per file under `server/src/routes/` (`board.ts`, `company.ts`, `market.ts`, `meta.ts`), each mounted under `/api`.
- Validate every input with Zod before business logic — the `limit` query param on `/api/board` and the `:slug` on company detail.
- SQL/business logic in `server/src/services/` (`db.ts` owns the pool + query helpers), not in handlers.
- A route whose figures come from more than one query runs its service inside `withSnapshot` (`db.ts`), one read-only repeatable-read transaction, so a poll committing mid-request can't make a headline disagree with its breakdowns.
- Single tail error-handling middleware in `middleware/errorHandler.ts`.

## API semantics

- `/api/board` reads `listings` (live open set) joined to `companies`; open now = `COUNT(listings)`, never the latest snapshot. Returns `{ market, companies, updatedAt }`, the companies ranked by open count (the client requests one page of `limit=250` and sorts locally, so `MAX_LIMIT` must stay above the seeded company count). `delta7d` is the change from the snapshot on or before 7 days before the latest release, `null` when gated; `delta30d` is the same at 30 days, and is also `null` until the company has a snapshot that far back. The market lead carries `changes` over 1/7/30/90 days, the `changeBases` they're measured from, and `atHigh90`, all gated globally, and `topTenShare`, live from day one. Market and sector changes sum only over companies whose own change is live.
- `/api/companies/:slug` and `/api/market` are read-only aggregates over `listings` + `daily_snapshots`; `/api/meta` returns the release stamp (`releaseNumber` = days from `MIN(tracked_since)` to `updatedAt`, plus one) and the curated-list facts the Method page cites. `updatedAt` = `MAX(snapshot_date)` as an ISO date, or `null` before the first poll (client shows day-zero).
- New figures are additive fields on the four existing endpoints, derived at query time from the four tables. Never add a column, table, or view for a number that a query can produce.
- **Gating** mirrors `GATING_DAYS = 14` (keep the constant in sync with the client). Trend fields (trajectory, market index, breadth, movers) return empty `points` / `null` deltas with `gated: true` on the trajectory, index, and movers; snapshot fields (open, breakdowns, sector totals) are never gated.

## Security

- `app.set('trust proxy', 1)` — Railway is one hop, so `req.ip` resolves to the real client (required for per-IP rate limiting). If fronted by Cloudflare, key off `CF-Connecting-IP`.
- No security-header middleware: this is a JSON API and never serves HTML (the client is a separate static build). Set HSTS at the edge if fronted by Cloudflare.
- Per-IP read rate limit via `express-rate-limit` (in-memory), `config.readRateLimitPerHour` across the GET endpoints.
- CORS allowlist via `config.allowedOrigins` (comma-separated env, `*` in dev).
- **Never leak raw upstream/pg error messages.** `errorHandler` only echoes `err.message` when the thrown error carries `isPublic: true`; everything else becomes "Bad request" below status 500 and "Internal server error" from 500 up. Don't include Zod issue paths or pg wording in client responses.

## Database

- Parameterized SQL queries (`$1`, `$2`) — never string-concatenate input.
- The `pg` pool (`max: 10`), release in `finally` blocks.
- Graceful degradation: if Postgres is unreachable, every read endpoint returns **503** rather than throwing an opaque 500. Railway's health check hits `/`, which needs no database.
- All date math is **UTC**: the poller's "today" becomes the snapshot date, and reads and retention count back from `MAX(snapshot_date)`.

## Environment

- Env vars read once at startup into a typed `config` object (`PORT`, `DATABASE_URL`, `ALLOWED_ORIGINS`, `READ_RATE_LIMIT_PER_HOUR`). A missing `DATABASE_URL` warns before falling back to the local default, so a misconfigured deploy never reads as an unreachable server.
- Log request outcome on each request. Never log full payloads, connection strings, or headers.
