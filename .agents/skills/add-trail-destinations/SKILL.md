---
name: add-trail-destinations
description: Research and draft new source-backed trail destinations for Trail Planner. Use when adding a destination or region, expanding the catalog, creating a destination dossier, or establishing initial destination, seasonality, access, hike, lodging, travel, or media coverage. Uses the Firecrawl CLI conservatively for official pages and never publishes invented or unreviewed data.
---

# Add Trail Destinations

Create a reviewable dossier for a new destination. Optimize for a trustworthy hub with explicit gaps, not superficial completeness.

## Required context

Read these before researching:

- `docs/CATALOG_DATA_PIPELINE.md`
- `docs/CATALOG_INGESTION_CHECKLIST.md`
- `data/catalog/dossier.template.json`
- `references/firecrawl.md`

Inspect the existing catalog and `data/catalog/drafts/` to avoid duplicate keys, destinations, and claims.

## Workflow

1. Define the candidate.
   - Establish a kebab-case stable key, official/common name, region, country code, and access-hub intent.
   - Reject a duplicate or explain why a separate destination is useful.
   - Decide which domains are required for this run. Start with `destination-core`, `seasonality`, and `access`; do not require a hike before the hub can be drafted.
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
5. Assess every targeted domain.
   - Use `fresh` only when the claims cover the intended domain.
   - Use `partial` for useful but incomplete data, `missing` for no adequate evidence, and `unavailable` only when a source supports unavailability.
   - Record conflicting sources in notes and reduce confidence; do not silently choose the convenient value.
6. Write the dossier.
   - Create `data/catalog/drafts/<destination-key>-add-<YYYY-MM-DD>.json` from the template.
   - Set all claims to `draft`. Do not edit the published catalog unless the user separately asks to ingest the reviewed dossier.
   - Validate with `pnpm catalog:validate -- <path>` and fix every error.
7. Report the outcome.
   - List sources used, Firecrawl credits before/after, coverage by domain, conflicts, and remaining gaps.
   - Recommend the smallest next refresh/ingestion task. Do not claim the destination is production-ready merely because the JSON validates.

## Source rules by domain

- Core coordinates/name: OSM or official geographic authority; preserve object/source URL.
- Season and access: park/trail authority and local transport/operator pages.
- Hikes: official route metadata plus OSM relation or licensed GPX for geometry. A prose description is not geometry.
- Lodging: official hut/campsite/operator pages. Prices are indicative with short expiry.
- Travel: provider APIs for routes/schedules/fares. Firecrawl only fills official local-service and transfer caveats.
- Media: Wikimedia Commons/API or clearly licensed official media with creator, license, dimensions, attribution, and source page.

Stop and ask for direction if the candidate identity is ambiguous, terms prohibit the intended use, the credit cap would be exceeded, or publication would require accepting a material conflict.
