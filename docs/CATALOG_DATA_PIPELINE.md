# Catalog data pipeline

Trail Planner separates live provider data from slower, judgment-heavy catalog curation. Runtime providers answer date-specific questions; agent skills create reviewable, source-backed dossiers for destination facts that cannot be obtained reliably from an API.

## Data flow

1. A coverage audit identifies a missing or stale domain for a stable `destinationKey`.
2. An enrichment job records the destination, domains, priority, retry budget, and state.
3. A provider adapter supplies structured live/open data, or an agent skill researches official pages with the Firecrawl CLI.
4. Every observation is stored as a field-level claim with its source URL, retrieval time, confidence, and expiry. Raw page captures remain temporary.
5. Coverage is recomputed per domain as `missing`, `partial`, `fresh`, `stale`, or `unavailable`.
6. Agent output remains `draft` until review. Publication builds a strict destination/travel snapshot from accepted claims; it never fills gaps with plausible values.

The schema foundations are `sourceRegistry`, `dataClaims`, `dataCoverage`, `enrichmentJobs`, and `providerCache`. The app can keep serving the current static catalog while ingestion is introduced incrementally.

## Domain and sourcing matrix

| Domain | Preferred source | Agent/Firecrawl role | Typical freshness |
| --- | --- | --- | --- |
| Destination core | OSM/Wikidata/official authority APIs | Resolve ambiguous hub names and official access nodes | Refresh on correction |
| Seasonality | Park, trail, mountain authority | Extract published seasons, closures, and caveats | Before each season or 180 days |
| Access | Routing/transit APIs plus official operators | Fill seasonal shuttle, boat, parking, and booking rules | 30–90 days; faster in season |
| Hike metadata | OSM relations, official route feeds/GPX | Curate route quality, duration, difficulty, warnings | 180–365 days |
| Hike geometry | OSM relation or licensed/official GPX | Locate the authoritative download; never infer a line from prose | Refresh when source changes |
| Lodging | Structured booking/provider data where licensed | Official hut/campsite facilities, dates, indicative prices | 30–90 days |
| Road travel | OSRM/openrouteservice/GraphHopper plus cost model | Official ferry/toll caveats only | Route 30 days; costs 7–30 days |
| Transit travel | Entur, GTFS/NeTEx, national journey APIs | Seasonal/local services absent from feeds | Live/date-specific or 7 days |
| Flight travel | Amadeus/Duffel and airport datasets | Airport-transfer caveats, not fares or schedules | Query live; cache briefly |
| Media | Wikimedia Commons API and licensed official media | Relevance/alt-text review and license verification | Refresh on removal/license change |

“Unavailable” requires evidence that the option is not practical under the stated assumptions. An unsuccessful search is `missing`, not `unavailable`. Partial data is useful: a destination hub may publish without hikes, a hike may publish without geometry only when the UI explicitly says geometry is being curated, and aggregate travel estimates may remain visible without invented stages.

## Agent skills

`$add-trail-destinations` researches a new hub, establishes the stable key and core provenance, gathers the cheapest useful set of domain claims, assesses coverage, and writes a dossier under `data/catalog/drafts/`. It does not silently publish or invent hikes.

`$refresh-trail-destination-data` starts from existing coverage, targets only missing/stale domains, compares new claims with accepted values, and creates a refresh dossier. It records conflicts for review instead of overwriting a value just because a newer page differs.

Both skills use `scripts/catalog-data/validate-dossier.mjs` and the template in `data/catalog/dossier.template.json`. A dossier is a review boundary, not a production record.

## Firecrawl operating policy

The CLI is installed from the official `firecrawl-cli` npm package. Authenticate with `firecrawl login` or the `FIRECRAWL_API_KEY` environment variable; credentials and `.firecrawl/` output must stay outside Git.

Free-tier limits can change, so every run starts with `firecrawl --status` and `firecrawl credit-usage --json`. The repository policy is stricter than the advertised ceiling:

- Run one request at a time and stop at 20 credits or 20 scraped pages per dossier unless the user approves more.
- Reuse known official URLs and Firecrawl cache (`--max-age`) before search.
- Reuse local `.catalog-work/` captures before calling Firecrawl again. The 2026-07-19 trials showed that Firecrawl cache hits still consumed a scrape credit on this account.
- Search at most five results and prefer authority/operator domains. Do not use broad crawl, autonomous agent, JSON/LLM extraction, screenshots, or Interact by default.
- Scrape main-content Markdown and links, then extract claims locally. Escalate to a targeted structured scrape only when ordinary output is insufficient and the credit budget is explicit.
- Keep raw output in `.catalog-work/<run-id>/`; commit only normalized claims and source URLs.
- Respect robots, site terms, copyright, and access controls. Never bypass login/paywalls or republish source prose.

See the official [Firecrawl CLI documentation](https://docs.firecrawl.dev/cli) for current commands and [scrape API reference](https://docs.firecrawl.dev/api-reference/endpoint/scrape) for behavior.

## Scaling and scheduling

The destination query is paginated, so catalog size is not capped at 50. Enrichment jobs are idempotent by `jobKey` and bounded by priority and retry count. Provider responses have explicit cache keys and expiry times. Free-tier Firecrawl work should be scheduled as small resumable batches—typically one destination or a few domains per run—rather than an all-catalog crawl.

The first production automation should prioritize high-value gaps: destination core and access, then at least one trustworthy hike, then travel modes and lodging. Broad destination expansion is safe because incomplete domains remain visible in coverage instead of forcing every destination to be fully sourced before it can exist as a draft.
