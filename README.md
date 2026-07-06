## ⚡ Overview

[**Rampr**](https://rampr.dev) shows which companies are actually ramping up hiring — it polls public ATS feeds daily, counts the open roles on each company's job board, and tracks how that count moves over time.

## 🔭 Architecture

```
┌─────────────────────────────────────────┐
│                 Browser                 │
│                                         │
│       ┌───────────┐  ┌─────────┐        │
│       │ React UI  │←→│ Zustand │        │
│       │(Tailwind) │  │  Store  │        │
│       └─────┬─────┘  └─────────┘        │
└─────────────┼───────────────────────────┘
              │ HTTPS
┌─────────────┴───────────────┐    ┌────────────────┐
│  Express API                │    │  Cron Poller   │
│  /api/board  /api/market    │    │    (daily)     │
│  /api/companies/:slug       │    │  Greenhouse /  │
│  /api/meta   /api/health    │    │ Lever / Ashby  │
└─────────────┬───────────────┘    └───────┬────────┘
              │                            │
      ┌───────┴────────────────────────────┴────┐    ┌────────────────┐
      │                Postgres                 │←───│  Cron Cleanup  │
      │  (sectors · companies · listings ·      │    │    (weekly)    │
      │   daily_snapshots)                      │    │  90-day prune  │
      └─────────────────────────────────────────┘    └────────────────┘
```

## 🚀 Stack

#### Client

- React 18 (TS)
- Tailwind CSS v3
- Zustand
- React Router
- Vite 5

#### Server

- Express (TS)
- pg + Zod
- express-rate-limit

#### Cron Poller

- Node.js script
- Native `fetch` + Zod
- Inline concurrency limiter
- pg driver

#### Cron Cleanup

- Node.js script
- pg driver

## 🛠️ Local Setup

#### 1. Clone the repository

```bash
git clone https://github.com/wu-wilson/rampr.git
cd rampr
```

#### 2. Set up Postgres (one-time)

```bash
brew install postgresql@18
brew services start postgresql@18
createdb rampr
psql rampr -f schema.sql
```

#### 3. Launch the app

```bash
./launch.sh
```

The script installs dependencies on first run, then starts the API server on port `3001` and the client on `http://localhost:5173`.

> Requires Node.js 18+ and npm 9+.

The crons are not started by `launch.sh` — they're scheduled jobs that run on Railway (daily poll, weekly cleanup). To run one locally: `cd cron-poller && npm start` or `cd cron-cleanup && npm start`.

## ☁️ Deployment

Deployed on [Railway](https://railway.app) as four services: the client ships as a static build (`rampr.dev`), the server runs as a separate API (`api.rampr.dev`), the poller runs daily to fetch the ATS feeds, and the cleanup runs weekly to prune old snapshots. DNS via [Cloudflare](https://www.cloudflare.com).

## ⚙️ Configuration

Every variable ships with a working default — `./launch.sh` runs on a fresh clone with no env files; override only to change a default.

- **Local dev** — create `client/.env`, `server/.env`, `cron-poller/.env`, or `cron-cleanup/.env` (all gitignored).
- **Production (Railway)** — variables are set in each service's **Variables** tab.

#### Client (`client/`)

| Variable       | Default                 | Description                                                               |
| -------------- | ----------------------- | ------------------------------------------------------------------------- |
| `VITE_API_URL` | `http://localhost:3001` | API server URL. Baked in at **build time** — changing requires a rebuild. |

#### Server (`server/`)

| Variable                   | Default                             | Description                                                         |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `PORT`                     | `3001`                              | API listen port. Auto-injected by Railway in production.            |
| `DATABASE_URL`             | `postgresql://localhost:5432/rampr` | Postgres connection. Read endpoints return 503 if unreachable.      |
| `ALLOWED_ORIGINS`          | `*`                                 | Comma-separated CORS allowlist. Set to `https://rampr.dev` in prod. |
| `READ_RATE_LIMIT_PER_HOUR` | `600`                               | Read requests/hr/IP across the GET endpoints.                       |

#### Cron Poller (`cron-poller/`)

| Variable             | Default                             | Description                                                        |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`       | `postgresql://localhost:5432/rampr` | Postgres connection. The poll fails loudly if unreachable.         |
| `POLL_CONCURRENCY`   | `4`                                 | Max ATS feeds fetched in parallel (polite per-host concurrency).   |
| `REQUEST_TIMEOUT_MS` | `10000`                             | Per-request timeout for outbound feed fetches, in milliseconds.    |
| `USER_AGENT`         | `rampr (+https://github.com/wu-wilson/rampr)` | Identifies the poller to ATS endpoints; production sets `rampr (+https://rampr.dev)`. |

Schedule is defined in `cron-poller/railway.json` via `cronSchedule` (currently `17 6 * * *` — daily 06:17 UTC).

#### Cron Cleanup (`cron-cleanup/`)

| Variable         | Default                             | Description                                                            |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`   | `postgresql://localhost:5432/rampr` | Postgres connection. The cleanup fails loudly if unreachable.         |
| `RETENTION_DAYS` | `90`                                | Daily snapshots older than this many days are deleted on each run.    |

Schedule is defined in `cron-cleanup/railway.json` via `cronSchedule` (currently `43 4 * * 0` — Sundays 04:43 UTC).
