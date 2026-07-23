---
name: add-trail-destinations
description: Research, validate, and publish new source-backed Trail Planner destinations. Use when adding a destination or region, expanding the catalog, or establishing initial destination, seasonality, access, hike, lodging, travel, or media coverage. Uses official sources and the Firecrawl CLI conservatively, performs all verification within the skill run, and never creates a user-review queue.
---

# Add Trail Destinations

Publish a trustworthy destination record with explicit gaps. The skill owns source verification, conflict resolution, validation, and publication; never defer data review to the user.

## Required context

Read these before researching:

- `docs/CATALOG_DATA_PIPELINE.md`
- `docs/CATALOG_PUBLICATION_CHECKLIST.md`
- `data/catalog/record.template.json`
- `references/firecrawl.md`

Inspect the existing catalog and `data/catalog/records/` to avoid duplicate keys, destinations, and claims.

## Workflow

1. Define the candidate.
   - Establish a kebab-case stable key, official/common name, region, country code, and access-hub intent.
   - Reject a duplicate or explain why a separate destination is useful.
   - Decide which domains are required for this run. Start with `destination-core`, `seasonality`, and `access`; a useful hub may publish with missing hike coverage.
2. Start a bounded run.
   - Announce skill use and the target domains before network calls.
   - Run the authentication and credit preflight in `references/firecrawl.md`.
   - Create `.catalog-work/<run-id>/` for raw output. Never commit this directory.
3. Discover sources narrowly.
   - Prefer already-known official URLs, OSM objects, authority APIs, and provider APIs.
   - Use at most one Firecrawl search with five results when URLs are unknown. Prefer park, mountain authority, tourism authority, operator, or government domains.
   - Treat community pages as discovery leads, not sole support for safety, season, geometry, or current logistics.
4. Scrape and extract claims.
   - Scrape one URL at a time with main-content Markdown and links.
   - Record a claim only when the page directly supports that field. Keep paraphrases short; do not copy source prose.
   - Give every claim a source key/URL, retrieval time, confidence, and refresh date.
   - Never infer route geometry, transport stages, availability, prices, or opening dates from plausible context.
5. Verify and assess every targeted domain.
   - Cross-check identity, high-impact logistics, season restrictions, and safety-sensitive claims before publication.
   - Exclude unsupported observations. Claims in a published record have no draft/accepted lifecycle status because validation is complete before they are written.
   - Use `fresh` only when the claims cover the intended domain.
   - Use `partial` for useful but incomplete data, `missing` for no adequate evidence, and `unavailable` only when a source supports unavailability.
   - Resolve conflicts from authoritative evidence. If a material conflict remains, omit the affected field, mark coverage `partial` or `missing`, and keep the conflict in notes; do not ask the user to adjudicate source data.
6. Validate and publish atomically.
   - Build the complete record from `data/catalog/record.template.json` in `.catalog-work/<run-id>/<destination-key>.json`.
   - Name the temporary file `<destination-key>.json`, run `pnpm catalog:publish -- --dry-run <temporary-path>`, and complete `docs/CATALOG_PUBLICATION_CHECKLIST.md`. Fix every failure before publication.
   - Run `pnpm catalog:publish -- <temporary-path>` to atomically replace `data/catalog/records/<destination-key>.json`. A record in this directory is published catalog data.
   - Update any checked-in catalog snapshot or seed that consumes the destination in the same run. Never leave a separate ingestion or user-review task.
   - Never create `data/catalog/drafts/` or a `needs-review` state.
7. Report the outcome.
   - List sources used, Firecrawl credits before/after, coverage by domain, conflicts, and remaining gaps.
   - State what was published and recommend the smallest automated refresh for remaining gaps.

## Source rules by domain

- Core coordinates/name: OSM or official geographic authority; preserve object/source URL.
- Season and access: park/trail authority and local transport/operator pages.
- Hikes: official route metadata plus OSM relation or licensed GPX for geometry. A prose description is not geometry.
- Lodging: official hut/campsite/operator pages. Prices are indicative with short expiry.
- Travel: provider APIs for routes/schedules/fares. Firecrawl only fills official local-service and transfer caveats.
- Media: Wikimedia Commons/API or clearly licensed official media with creator, license, dimensions, attribution, and source page.

Stop without publishing if candidate identity remains ambiguous, terms prohibit the intended use, the credit cap would be exceeded, or a required core field remains materially conflicted after checking authoritative sources. Ask the user only for product scope or identity clarification, never to review or approve researched data.
