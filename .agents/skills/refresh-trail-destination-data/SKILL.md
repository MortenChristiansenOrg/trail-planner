---
name: refresh-trail-destination-data
description: Fill missing or refresh stale source-backed travel and hiking data for existing Trail Planner destinations. Use for coverage audits, stale claims, missing hikes or geometry, outdated access/lodging/seasonality, or travel data refreshes. Uses provider APIs first and the Firecrawl CLI conservatively for official pages, producing reviewable claim dossiers without silent overwrites.
---

# Refresh Trail Destination Data

Refresh only the domains that need work. Preserve accepted history and surface conflicts instead of rewriting the catalog from the latest page scrape.

## Required context

Read these before researching:

- `docs/CATALOG_DATA_PIPELINE.md`
- `docs/CATALOG_INGESTION_CHECKLIST.md`
- `data/catalog/dossier.template.json`
- `references/firecrawl.md`

Inspect the destination, accepted provenance, existing drafts, coverage rows, and queued work. If no coverage rows exist, audit the current catalog fields and mark the assessment provisional.

## Workflow

1. Select scope.
   - Target explicit user domains or those marked `missing`, `partial`, or `stale`.
   - Do not refresh fresh unrelated domains “while here.” Small resumable runs suit the Firecrawl free tier.
   - For date-specific routes, schedules, or fares, use the runtime provider path when one exists. Do not replace it with scraped aggregate prose.
2. Start a bounded run.
   - Announce the skill, destination, target domains, and why each is due.
   - Run the authentication/credit preflight in `references/firecrawl.md`.
   - Create `.catalog-work/<run-id>/` for raw output.
3. Revisit registered sources first.
   - Prefer the prior source URL, official replacement, provider API, OSM relation, or licensed GPX.
   - Search only when the old URL is gone or cannot cover the gap.
   - Record redirects and disappeared sources; absence is not proof that the underlying service or route is unavailable.
4. Compare field-level claims.
   - Preserve the old claim and create a new `draft` claim with its own retrieval/observation times.
   - Note unchanged values, material changes, and contradictions. Shorten expiry for volatile prices/schedules.
   - Never construct intermediate travel stages, trail geometry, season dates, or prices that the source does not provide.
5. Assess coverage.
   - `fresh`: adequate accepted evidence after review.
   - `partial`: useful evidence but required fields remain unresolved.
   - `stale`: current accepted evidence is past expiry and no reviewed replacement exists.
   - `missing`: no accepted evidence.
   - `unavailable`: a source directly supports non-availability under recorded assumptions.
6. Write and validate.
   - Create `data/catalog/drafts/<destination-key>-refresh-<YYYY-MM-DD>.json`.
   - Include only researched claims plus coverage for every targeted/claimed domain.
   - Run `pnpm catalog:validate -- <path>` and fix all errors.
   - Do not modify published values or mark claims accepted unless the user separately requests ingestion/review.
7. Report.
   - State credits used, URLs checked, changes found, conflicts, failed sources, domains still stale/missing, and the recommended next run.
   - Distinguish “Firecrawl could not retrieve the page” from “the information is unavailable.”

## Refresh priority

Prioritize imminent safety/access restrictions and seasonal operators, then stale travel/lodging prices, then hike metadata/media. Stable core coordinates and geometry need refresh only after a source change, correction, or validation failure.

Stop and ask for direction when a material value conflicts across authoritative sources, source terms block reuse, the credit cap would be exceeded, or a change would remove published route geometry without a reviewed replacement.
