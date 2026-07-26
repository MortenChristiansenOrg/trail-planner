# Catalog publication checklist

The destination skills execute this checklist before publishing a catalog record. There is no draft state or user approval step. Build the candidate record in `.catalog-work/`, validate it, then atomically replace `data/catalog/records/<destination-key>.json` only when every applicable check passes.

## Destination

- [ ] Name, region, country code, longitude, and latitude match an official map or OpenStreetMap object.
- [ ] Recommended hiking months are published only when an authority supports exact months; otherwise retain broad seasonality or mark the domain partial/missing.
- [ ] Terrain character is a short supported summary without safety guarantees.
- [ ] Access claims name their node/trailhead assumption and do not invent schedules, fares, or intermediate stages.
- [ ] Lodging names, facilities, and indicative prices come from operator sources; volatile prices expire quickly.
- [ ] Every published claim includes source URL, retrieval time, confidence, and refresh timing.

## Hike and geometry

- [ ] Hike and geometry coverage remain `missing`; the active catalog publishes no hikes until the complete pipeline in GitHub issue #23 is implemented.
- [ ] Destination visibility never depends on a route count, difficulty variety, duration variety, or prose length quota.
- [ ] No route name, description, duration, distance, ascent, difficulty, trailhead, route type, or geometry is inferred to make a record appear complete.

## Media

- [ ] The image depicts the destination or hike and has useful, non-duplicative alt text.
- [ ] Original width and height are recorded to prevent layout shift.
- [ ] Subject, kind, creator, license, attribution text/URL, source URL, and verification timestamp are present.
- [ ] The license is allowlisted and permits this use. Wikimedia Commons ImageInfo/structured data is preferred.
- [ ] Remote images are not proprietary trail-site assets, unlicensed hotlinks, or missing inspectable credit.

## Publication

- [ ] The shared product conventions and generated coverage report were read before research.
- [ ] Canonical key, aliases, visibility, and readiness are explicit.
- [ ] Unsupported observations were discarded and authoritative conflicts were resolved or omitted with reduced coverage.
- [ ] `pnpm catalog:publish -- --dry-run <temporary-record>` passes before publication.
- [ ] `pnpm catalog:publish -- <temporary-record>` atomically replaces the record and regenerates all artifacts.
- [ ] `pnpm catalog:check` confirms deterministic output with no drift.
- [ ] `pnpm test`, `pnpm typecheck`, and relevant catalog browser tests pass after publication.
- [ ] Raw Firecrawl captures remain in `.catalog-work/` and are not committed.
- [ ] `pnpm catalog:validate-travel` passes when reusable travel parts or destination trip matrices change.
- [ ] Every destination has explicit car, train/bus, and airplane states; unavailable details have a user-facing reason.
- [ ] Ferry stages reference a shared travel part and include the 60-minute recommended terminal-arrival allowance.
