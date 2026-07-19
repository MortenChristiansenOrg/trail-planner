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

- [ ] Route name, duration, distance, ascent, and difficulty are supported by an official route source.
- [ ] Geometry comes from an official download, an OSM relation, or a verified licensed GPX; never generate a plausible route.
- [ ] Corrections retain source URL, run ID, verification time, and a description of the change in Git history.
- [ ] Missing geometry is represented as missing coverage. The destination hub may still publish without hikes.

## Media

- [ ] The image depicts the destination or hike and has useful, non-duplicative alt text.
- [ ] Original width and height are recorded to prevent layout shift.
- [ ] Subject, kind, creator, license, attribution text/URL, source URL, and verification timestamp are present.
- [ ] The license is allowlisted and permits this use. Wikimedia Commons ImageInfo/structured data is preferred.
- [ ] Remote images are not proprietary trail-site assets, unlicensed hotlinks, or missing inspectable credit.

## Publication

- [ ] Unsupported observations were discarded and authoritative conflicts were resolved or omitted with reduced coverage.
- [ ] `pnpm catalog:publish -- --dry-run <temporary-record>` passes before publication.
- [ ] `pnpm catalog:publish -- <temporary-record>` atomically replaces the published record.
- [ ] Any checked-in catalog snapshot or seed consuming the record is updated in the same run.
- [ ] `pnpm test`, `pnpm typecheck`, and relevant catalog browser tests pass after publication.
- [ ] Raw Firecrawl captures remain in `.catalog-work/` and are not committed.
