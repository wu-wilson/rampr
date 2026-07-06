---
name: ats-feeds
description: Greenhouse / Lever / Ashby public feed endpoints, response shapes, the fields rampr extracts, and remote-type inference. Read before writing or changing a poller adapter.
---

# ATS feeds

All three are public JSON, no auth. Each adapter fetches one board token and returns `NormalizedListing[]`:
`{ externalId, department, location, remoteType }` (`remoteType ∈ 'remote'|'hybrid'|'onsite'|'unknown'`). Title is not persisted — rampr only counts and breaks down roles. **One posting = one open role; never dedup.** Parse defensively with Zod; a missing optional field becomes `null` / `'unknown'`, not a throw.

## Greenhouse

`GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`

```jsonc
{ "jobs": [ { "id": 123, "title": "…",
              "location": { "name": "San Francisco, CA" },
              "departments": [ { "name": "Engineering" } ] } ] }
```
- `externalId` = `String(job.id)`
- `department` = first `departments[].name` that isn't empty or `"No Department"`, else `null`
- `location` = `location.name ?? null`
- `remoteType` — no native flag; infer from `location.name` (see below)

## Lever

`GET https://api.lever.co/v0/postings/{token}?mode=json` → a **JSON array**.

```jsonc
[ { "id": "abc-123", "text": "Senior Engineer",
    "categories": { "department": "Engineering", "team": "Core", "location": "Remote - US" },
    "workplaceType": "remote" } ]
```
- `externalId` = `id` (already a string)
- `department` = `categories.department ?? categories.team ?? null`
- `location` = `categories.location ?? null`
- `remoteType` — prefer native `workplaceType`: `remote → remote`, `hybrid → hybrid`, `on-site`/`onsite → onsite`; else infer from `location`.

## Ashby

`GET https://api.ashbyhq.com/posting-api/job-board/{token}`

```jsonc
{ "jobs": [ { "id": "uuid", "title": "…", "department": "Engineering",
              "team": "Core", "location": "New York", "isRemote": true } ] }
```
- `externalId` = `String(id)`
- `department` = `department ?? team ?? null`
- `location` = `location ?? null`
- `remoteType` — native `isRemote === true → remote`; else infer from `location` (Ashby has no hybrid flag, so a non-remote located role reads `onsite`).

## Remote-type inference (shared helper)

Given a native flag (if any) and a location string, in order:
1. Native provider flag wins (`workplaceType`, `isRemote`).
2. Else match the location string, case-insensitive: contains `hybrid` → `hybrid`; contains `remote` → `remote`; non-empty otherwise → `onsite`.
3. Else → `unknown`.

Keep the fallback conservative — `unknown` is honest and surfaces as a residual work-mix slice, whereas guessing skews the remote share.

## Fetching

Use native `fetch` with a descriptive `User-Agent` (`config.userAgent`), an `AbortController` timeout (`config.requestTimeoutMs`), and a couple of retries with exponential backoff; treat non-2xx as retryable. A feed that fails after retries throws — the poller isolates and skips that company (no reconcile or snapshot) so an outage can't zero it. A fetch that *succeeds* with zero roles is a genuine `0` and is reconciled normally.

## Workday

Intentionally **not** implemented for v1. Several well-known companies use Workday/SmartRecruiters and are simply left out of the seed rather than adapted.
