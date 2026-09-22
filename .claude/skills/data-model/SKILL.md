---
name: data-model
description: The four tables, how every board/company/market number is derived, gating, changes, and work-mix definitions, and the JSON contract for each API endpoint. Read before writing server queries or client hooks.
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
- **Work mix** (company) = shares of remote / hybrid / onsite over open roles; `unknown` is the residual, shown as "Not stated".
- **7-day change** (`delta7d`) = `open_now − open_count` from the **most recent snapshot on or before 7 days before the latest release** (tolerates a missed poll); `null` while the company has fewer than 14 snapshots or no such snapshot exists. **30-day change** (`delta30d`) is the same against 30 days before the latest release. Every window counts back from `MAX(snapshot_date)`, never the calendar day, so nothing shifts before the morning poll.
- **Market changes** (1 / 7 / 30 / 90 days) = the sum of `open_now − prior` over every company whose own change is live (14 snapshots and a snapshot that old), so a board added mid-window never reads as growth; `null` while globally gated or when no company qualifies. **Sector 7-day changes** use the same rule within a sector.
- **At a 90-day high** = count of companies (with ≥14 snapshots and open roles) whose `open_now` ≥ `MAX(open_count)` over the last 90 days. **Top-ten share** = sum of the ten largest `open_now` over the total, integer percent.
- **Release number** = `MAX(snapshot_date) − MIN(tracked_since) + 1`; `null` before the first poll.
- **Market index point** (per day) = `SUM(open_count)` across companies for that `snapshot_date`.
- **Breadth point** (per day) = count of companies whose `open_count` rose from their previous snapshot (`LAG` per company) and count that fell. A date where no company has a previous snapshot is left out of the series.
- **Sector rank / share** (company page) = `ROW_NUMBER` by `open_now` within the sector, the sector's company count, and the sector's summed `open_now` (the client divides for the share).
- **Movers** = per-company 7d `delta`, top N positive = heating, top N negative = cooling, each with its sector label. A company must have ≥14 of its own daily snapshots to appear.

## Gating

`GATING_DAYS = 14` (mirror the constant in client and server, with a "keep in sync" comment).

- **Per-company** `gated = daysTracked < 14`, where `daysTracked = COUNT(*) FROM daily_snapshots WHERE company_id = $1`.
- **Global** (market changes, index, breadth, sector changes, movers) `gated = COUNT(DISTINCT snapshot_date) < 14`; the market and sector changes and the movers also drop any company that hasn't cleared the per-company gate above.

Gated trend fields return empty `points` / `null` deltas, with `gated: true` on the trajectory, index, and movers; the client renders the gated panel ("builds at 14 releases", N of 14 cells). Snapshot fields (open, breakdowns, sector totals) are never gated.

## Endpoint contract

All read-only JSON under `/api`. Money-free; counts are integers. `updatedAt` = `MAX(snapshot_date)` as an ISO date (or `null` before the first poll).

### `GET /api/board?limit=`
- `limit` is the most companies to return by rank, default 25, max 250. The client requests `limit=250` once and sorts and filters locally.
```jsonc
{
  "market":  { "totalOpen": 8317, "companyCount": 100,
               "changes": { "day1": 38, "day7": 215, "day30": null, "day90": null }, // each null when gated / no prior
               "atHigh90": 14, "topTenShare": 38 },                                 // atHigh90 null when gated
  "companies": [
    { "rank": 1, "slug": "stripe", "name": "Stripe", "sector": "fintech",
      "sectorLabel": "Fintech", "open": 812,
      "delta7d": 31, "delta30d": null }                                            // each null when gated / no prior
  ],
  "updatedAt": "2026-07-19"
}
```

### `GET /api/companies/:slug`
```jsonc
{
  "company": { "name": "Databricks", "sectorLabel": "Data/AI", "rank": 2, "companyCount": 100,
               "sectorRank": 1, "sectorCompanyCount": 12, "sectorOpen": 2143,
               "trackedSince": "2026-06-28",
               "careersUrl": "https://boards.greenhouse.io/databricks", "source": "greenhouse" },
               // careersUrl is null when the company has no board link
  "open": 288,
  "delta7d": 24,                                                                // null when gated / no prior
  "breakdowns": {
    "departments": [ { "name": "Engineering", "count": 141 } ],
    "locations":   [ { "name": "San Francisco", "count": 96 } ],
    "workMix": { "remote": { "pct": 38, "count": 109 }, "hybrid": { "pct": 44, "count": 127 },
                 "onsite": { "pct": 18, "count": 52 }, "unknown": { "pct": 0, "count": 0 } }
  },
  "trajectory": { "gated": false, "daysTracked": 22,
                  "points": [ { "date": "2026-06-28", "count": 240 } /* ... the last 90 days */ ] }
  // while gated: { "gated": true, "daysTracked": 6, "points": [] }
}
```
404 with `{ "error": "..." }` when the slug is unknown.

### `GET /api/market`
```jsonc
{
  "totals": { "totalOpen": 8317, "updatedAt": "2026-07-19" },
  "sectors": [ { "slug": "data-ai", "label": "Data/AI", "open": 2143, "pct": 100, "delta7d": 24 } ],
  // pct scales the sector bar against the largest sector (the leader is 100), not a share of totalOpen;
  // the viewer-visible share comes from open / totals.totalOpen, computed client-side
  "index":   { "gated": false, "daysTracked": 22, "points": [ { "date": "2026-07-19", "totalOpen": 8317 } ] },
  "breadth": { "points": [ { "date": "2026-07-19", "rising": 31, "falling": 12 } ] },   // shares the index gate
  "movers":  { "gated": false,
               "heating": [ { "slug": "stripe", "name": "Stripe", "sectorLabel": "Fintech", "delta": 31 } ],
               "cooling": [ { "slug": "gusto", "name": "Gusto", "sectorLabel": "Fintech", "delta": -9 } ] }
  // while gated: the index carries gated: true with daysTracked and empty points, and the movers carry gated: true with empty lists
}
```

### `GET /api/meta`
The release stamp for the masthead and the facts the Method page cites; screens derive day-zero from their own `updatedAt`.
```jsonc
{ "updatedAt": "2026-07-19", "releaseNumber": 22,     // both null before the first poll; releaseNumber = days since tracking began + 1
  "firstRelease": "2026-06-28", "companyCount": 100,   // firstRelease null only with no companies seeded
  "sources": { "greenhouse": 64, "lever": 10, "ashby": 26 } }
```

## Day-zero

Before the first successful poll: `listings` and `daily_snapshots` are empty. Endpoints return zeros / empty arrays / `updatedAt: null`; the client renders a designed "Before the first release" empty state, distinct from the gated state.
