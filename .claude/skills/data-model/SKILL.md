---
name: data-model
description: The four tables, how every board/company/market number is derived, gating + momentum + remote-share definitions, and the JSON contract for each API endpoint. Read before writing server queries or client hooks.
---

# rampr data model & API contract

## Tables (see `schema.sql`)

- **sectors** `(slug PK, label, sort_order)` — 9 curated rows.
- **companies** `(id PK, slug UNIQUE, name, sector_slug FK, ats_provider, ats_id, careers_url, tracked_since)` — curated seed.
- **listings** `(id PK, company_id FK, external_id, department, location, remote_type)` — **currently-open roles only**; `UNIQUE(company_id, external_id)`.
- **daily_snapshots** `(company_id FK, snapshot_date, open_count, PK(company_id, snapshot_date))` — forward-only time series.

No views, no aggregate tables. Everything below is derived at query time.

## Derived quantities

- **Open now** (per company) = `COUNT(*) FROM listings WHERE company_id = $1`. Never the latest snapshot — the count and the breakdowns must come from the same rows.
- **Breakdowns** = `GROUP BY department | location | remote_type` over that company's `listings`.
- **Remote share** = `remote / total_open` (hybrid excluded), integer percent. Used for the board's remote column.
- **Work mix** (company) = shares of remote / hybrid / onsite over open roles; `unknown` is shown as a residual slice only when `> 0`.
- **Momentum (7d)** = `open_now − open_count` from the **most recent snapshot on-or-before `CURRENT_DATE − 7`** (tolerates a missed poll). Returned as a signed integer `delta` + `direction` (`'up' | 'down' | 'flat'`); `null` when gated.
- **Market index point** (per day) = `SUM(open_count)` across companies for that `snapshot_date`.
- **Movers** = per-company 7d `delta`, top N positive = heating, top N negative = cooling.

## Gating

`GATING_DAYS = 14` (mirror the constant in client and server, with a "keep in sync" comment).

- **Per-company** `gated = daysTracked < 14`, where `daysTracked = COUNT(*) FROM daily_snapshots WHERE company_id = $1`.
- **Global** (market index + movers) `gated = COUNT(DISTINCT snapshot_date) < 14`.

Gated trend fields return `gated: true` with empty `points` / `null` deltas; the client renders the "trend building — N of 14" state. Snapshot fields (open, breakdowns, sector totals) are never gated.

## Endpoint contract

All read-only JSON under `/api`. Money-free; counts are integers. `updatedAt` = `MAX(snapshot_date)` as an ISO date (or `null` before the first poll).

### `GET /api/board?sector=&q=&sort=&limit=&offset=`
- `sector` sector slug or omitted (all); `q` name search; `sort` `open` (default) | `momentum`; `limit` default 25; `offset` default 0.
```jsonc
{
  "market":  { "totalOpen": 84317, "companyCount": 100, "sectorCount": 9,
               "gated": true, "delta7d": null },
  "companies": [
    { "rank": 1, "slug": "stripe", "name": "Stripe", "sector": "fintech",
      "sectorLabel": "Fintech", "open": 312, "remotePct": 41,
      "momentum": { "delta": 18, "direction": "up", "gated": false } }
  ],
  "total": 100,          // matching companies, for load-more
  "updatedAt": "2026-07-05"
}
```

### `GET /api/companies/:slug`
```jsonc
{
  "company": { "slug": "databricks", "name": "Databricks", "sector": "data-ai",
               "sectorLabel": "Data/AI", "rank": 2, "trackedSince": "2026-06-28",
               "careersUrl": "https://boards.greenhouse.io/databricks", "source": "greenhouse" },
               // careersUrl is null when the company has no board link
  "open": 288,
  "momentum": { "delta": 24, "direction": "up", "gated": false },
  "breakdowns": {
    "departments": [ { "name": "Engineering", "count": 141 } ],
    "locations":   [ { "name": "San Francisco", "count": 96 } ],
    "workMix": { "remote": { "pct": 38, "count": 109 }, "hybrid": { "pct": 44, "count": 127 },
                 "onsite": { "pct": 18, "count": 52 }, "unknown": { "pct": 0, "count": 0 } }
  },
  "trajectory": { "gated": true, "daysTracked": 6, "points": [] }
  // when live: points = [ { "date": "2026-06-28", "count": 240 }, ... ] up to 90 days
}
```
404 with `{ "error": "..." }` when the slug is unknown.

### `GET /api/market`
```jsonc
{
  "totals": { "totalOpen": 84317, "companyCount": 100, "sectorCount": 9, "updatedAt": "2026-07-05" },
  "sectors": [ { "slug": "data-ai", "label": "Data/AI", "open": 21480, "pct": 100 } ],
  "index":   { "gated": true, "daysTracked": 6, "points": [] },
  "movers":  { "gated": true, "heating": [], "cooling": [] }
  // when live: index.points = [ { "date": "...", "totalOpen": 83000 } ];
  //            heating/cooling = [ { "slug": "...", "name": "...", "delta": 31 } ]
}
```

### `GET /api/meta`
The lightweight last-updated stamp for the nav; screens derive day-zero from their own `updatedAt`.
```jsonc
{ "updatedAt": "2026-07-05" }   // null before the first poll
```

### `GET /api/health`
```jsonc
{ "status": "ok", "lastUpdated": "2026-07-05" }
```

## Day-zero

Before the first successful poll: `listings` and `daily_snapshots` are empty. Endpoints return zeros / empty arrays / `updatedAt: null`; the client renders a designed "tracking just started" empty state, distinct from the gated-trend state.
