---
name: refresh-trail-destination-data
description: Verify and publish missing or stale source-backed travel and hiking data for existing Trail Planner destinations. Use for coverage audits, stale claims, missing hikes or geometry, outdated access/lodging/seasonality, or travel data refreshes. Uses provider APIs first and the Firecrawl CLI conservatively, completes verification within the skill run, and publishes validated updates without a user-review queue.
---

# Refresh Trail Destination Data

Refresh only the domains that need work. Preserve valid published values unless verified replacements supersede them. The skill owns verification and publication; never defer source review to the user.

## Required context

Read these before researching:

- `docs/CATALOG_DATA_PIPELINE.md`
- `docs/CATALOG_PUBLICATION_CHECKLIST.md`
- `data/catalog/record.template.json`
- `references/firecrawl.md`

Inspect the published destination record, provenance, coverage rows, and queued work. If no coverage rows exist, audit the current catalog fields before changing them.

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
4. Compare and verify field-level claims.
   - Compare the published claim with the new observation and preserve both source histories in Git; the published record contains only the current verified claim.
   - Note unchanged values, material changes, and contradictions. Shorten expiry for volatile prices/schedules.
   - Never construct intermediate travel stages, trail geometry, season dates, or prices that the source does not provide.
   - Resolve authoritative conflicts within the run. If unresolved, retain the prior supported value or omit the affected field and reduce coverage; do not create a user approval task.
5. Assess coverage.
   - `fresh`: adequate evidence verified during the run.
   - `partial`: useful evidence but required fields remain unresolved.
   - `stale`: current published evidence is past expiry and no verified replacement exists.
   - `missing`: no published evidence.
   - `unavailable`: a source directly supports non-availability under recorded assumptions.
6. Validate and publish atomically.
   - Build the merged record in `.catalog-work/<run-id>/<destination-key>.json` from the existing `data/catalog/records/<destination-key>.json`.
   - Include current verified claims plus coverage for every targeted/claimed domain. Claims have no lifecycle status.
   - Name the temporary file `<destination-key>.json`, run `pnpm catalog:publish -- --dry-run <temporary-path>`, and complete `docs/CATALOG_PUBLICATION_CHECKLIST.md`.
   - Run `pnpm catalog:publish -- <temporary-path>` only after all checks pass, then update any checked-in snapshot or seed that consumes it.
   - Never create a draft, review queue, `needs-review` job, or separate ingestion request.
7. Report.
   - State credits used, URLs checked, changes found, conflicts, failed sources, domains still stale/missing, and the recommended next run.
   - Distinguish “Firecrawl could not retrieve the page” from “the information is unavailable.”

## Refresh priority

Prioritize imminent safety/access restrictions and seasonal operators, then stale travel/lodging prices, then hike metadata/media. Stable core coordinates and geometry need refresh only after a source change, correction, or validation failure.

Stop without changing the published record when source terms block reuse, the credit cap would be exceeded, identity is ambiguous, or verified replacement geometry cannot safely supersede current geometry. Ask the user only for product-scope decisions, never to inspect or approve source data.
