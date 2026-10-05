---
name: seed-audit
description: Check every seeded company's ATS board and production trend for a move or an odd pattern, re-point or replace the companies that moved, and return the production SQL to apply. Use when a feed starts failing, a trend looks off, or for a periodic seed check.
---

# Seed audit

The seed in `schema.sql` is the source of truth for which board each company is read from. Endpoints, tokens, and response shapes are in the `ats-feeds` skill.

## Check

Probe every company in the seed politely: User-Agent `rampr (+https://rampr.dev)`, at most 4 requests in flight, ~250ms between requests, and two retries on a timeout or 5xx. A 404 is final, and a feed still failing after its retries is reported, not acted on.

1. Fetch the configured feed (`ats_provider` + `ats_id`), count its postings, and find its newest posting: Greenhouse `first_published` (not `updated_at`, which Greenhouse refreshes routinely), Lever `createdAt` (epoch ms), Ashby `publishedAt`. A board with postings but none first published in the last 60 days is **stale**. A company that moves away often leaves its old board live and frozen.
2. Probe all three providers, the configured one included, with each candidate token: `ats_id`, the slug, the slug without hyphens, and the name lowercased to letters and digits.
3. Confirm every board you rely on is the company's, the configured one included: its titles and locations, and on Greenhouse the board's `name` (`GET /v1/boards/<token>`). Tokens can belong to a different company with the same name.

| Configured board | Postings on another supported board | Verdict |
|---|---|---|
| Live and fresh | No | Fine. |
| Live and fresh | Yes | Ambiguous. Report it, change nothing. |
| 404, empty, stale, or another company's | Yes | **Moved**: re-point it. |
| 404, empty, stale, or another company's | No | The company's own careers page decides. A supported board under another token is a **move**. Workday, SmartRecruiters, and the like are unsupported: **replace** it. The configured board itself means it's quiet: keep it (an empty board is a genuine `0`). |

Empty boards on other providers are common leftovers from earlier moves. Ignore them.

Careers pages often embed their board (a Greenhouse `embed/job_board/js?for=<token>` script names the token) or build the job list in the browser. When a page shows no board or blocks fetchers, search the web for the company's recent postings and where they link, and for news of an acquisition.

## Trends

Read each company's last 90 releases from production: `GET https://api.rampr.dev/api/companies/<slug>` (`trajectory.points`, empty until 14 releases). Send one request at a time with ~300ms between them, since the API allows 600 an hour per IP. The release dates are every date any company has a point. Flag a company whose trend shows:

| Signal | Threshold | Often means |
|---|---|---|
| Missed releases | No point on the latest release, or 2+ missing in its window | The feed is failing (the poller log names each skipped feed) |
| Frozen | The same count for 21+ releases in a row | An abandoned board |
| Drop | A one-release fall of 40%+ from 20+ postings | A move, a changed token, or a truncated feed |
| Fade | 75%+ below its window peak, from a peak of 20+ | Roles moving to another board |
| Spike | A one-release rise of 50%+ to 20+ postings | Another company's board under the token, or duplicates |

Investigate every flagged company with the Check steps, reading its careers page even when its board looks fine. A genuine hiring change (a freeze, layoffs, a push) is reported and left alone.

## Moved to a supported ATS

Any change to `ats_provider` or `ats_id` resets the company to a first-time track: its listings and snapshots are deleted and `tracked_since` restarts today (UTC).

- **Codebase:** edit the company's seed row in `schema.sql`: provider, token, and `careers_url` (`https://boards.greenhouse.io/<token>`, `https://jobs.lever.co/<token>`, or `https://jobs.ashbyhq.com/<token>`). The slug and the mark stay.
- **Commit:** `fix: move <company> to <provider>`.

## Moved to an unsupported ATS

Replace it with a well-known company in the **same sector** whose board is live on Greenhouse, Lever, or Ashby, with a healthy number of postings, and whose slug and `(provider, token)` aren't already seeded. Propose the pick, with an alternate, and confirm with the user before editing.

- **Codebase:** replace the seed row in place in `schema.sql`, keeping the company count unchanged. Add the new mark at `client/public/marks/<slug>.png` (a 128×128 colour PNG of the company's icon, e.g. its apple-touch-icon or `https://www.google.com/s2/favicons?domain=<domain>&sz=128`, checked to be the logo rather than the service's default globe), and delete the old company's mark. The companies strip loads marks by slug, so a missing file leaves an empty slot.
- **Commit:** `fix: swap <old> for <new>`.

Before committing either change, load `schema.sql` into a throwaway database (`createdb seedcheck && psql -v ON_ERROR_STOP=1 -d seedcheck -f schema.sql`, then `dropdb seedcheck`) and check it seeds the same number of companies as before.

## Production SQL

Return one transaction covering every change. Never re-apply `schema.sql` to production: the seed only inserts, so an existing row won't update and a changed provider collides on the slug. Deleting a company cascades to its listings and snapshots.

```sql
BEGIN;

DELETE FROM companies WHERE slug = '<old slug>';

INSERT INTO companies (slug, name, sector_slug, ats_provider, ats_id, careers_url, tracked_since)
VALUES ('<slug>', '<Name>', '<sector>', '<provider>', '<token>', '<careers url>', (now() AT TIME ZONE 'UTC')::date);

COMMIT;
```

A moved company deletes and re-inserts its own slug. A replacement deletes the old slug and inserts the new company. Return a verification query alongside it:

```sql
SELECT c.slug, c.ats_provider, c.ats_id, c.careers_url, c.tracked_since,
       (SELECT COUNT(*) FROM listings l WHERE l.company_id = c.id)        AS listings,
       (SELECT COUNT(*) FROM daily_snapshots s WHERE s.company_id = c.id) AS snapshots,
       (SELECT COUNT(*) FROM companies)                                   AS companies_total,
       (SELECT MIN(tracked_since) FROM companies)                         AS first_release
  FROM companies c
 WHERE c.slug IN ('<slug>');
```

List the new slugs and any replaced old slug. Expect each new slug at today's date with `0` listings and `0` snapshots until the next poll, no row for a replaced old slug, an unchanged company count, and an unchanged `first_release`. Release numbers count from the earliest `tracked_since`, which other seeded companies still hold.

Once applied, run the poller or wait for the 08:00 UTC release. A reset company shows "Not counted yet" until its first poll, then builds toward 14 releases like any new board.

## Report

List the moved, replaced, and ambiguous companies (each with old and new board and posting counts), each flagged trend with what investigating it found, the files changed, the commit message, and the SQL. If nothing moved or looks off, say so in one line.
