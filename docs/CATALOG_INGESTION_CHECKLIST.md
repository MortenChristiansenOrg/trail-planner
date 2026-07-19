# Catalog ingestion and validation checklist

Complete this checklist before changing a destination or hike from draft to published. A useful access or logistics hub may be published without hikes; leave `hikes` empty and let the UI show “Trails being curated” until route geometry passes review.

## Destination

- [ ] Name, region, country code, longitude, and latitude match an official map or OpenStreetMap.
- [ ] Recommended hiking months are supported by the park, trail operator, or local mountain authority; seasonal access restrictions are recorded.
- [ ] Terrain character describes relevant conditions without making safety guarantees.
- [ ] Every travel mode has an explicit available/unavailable state and a named access node or trailhead assumption.
- [ ] Known lodging name, kind, and indicative price have been reviewed; stale prices are clearly estimates.
- [ ] `provenance.sourceUrl`, `reviewedAt`, and confidence are present. Prefer park/route authorities, official tourism bodies, or OSM relations.

## Hike and geometry

- [ ] Route name, duration, distance, ascent, and difficulty are supported by an official route source.
- [ ] Geometry comes from an official download, an OSM relation, or a verified GPX; never generate a plausible-looking route.
- [ ] Manual corrections retain the original source URL, editor, review date, and a description of the change.
- [ ] Missing or uncertain route geometry remains unpublished; hike metadata may stay visible only with an explicit “route geometry being curated” state, and the destination can stay available as a hub.

## Media

- [ ] The image depicts the destination or hike and has useful, non-duplicative alt text.
- [ ] Original responsive width and height are recorded to prevent layout shift.
- [ ] Subject, kind, creator, license, attribution text/URL, source URL, and review timestamp are present.
- [ ] The license is on the application allowlist and permits this use. Wikimedia Commons ImageInfo/structured data is the preferred first source.
- [ ] Remote images are not proprietary trail-site assets, hotlinked without permission, or missing inspectable credit.
- [ ] List thumbnails use responsive sources and lazy loading; only the active hero may load eagerly.

Run `pnpm test`, `pnpm typecheck`, and the catalog browser test after ingestion. `validateCatalog` must accept the published collection.

Before proposing ingestion, validate the review dossier with `pnpm catalog:validate -- data/catalog/drafts/<file>.json`. Raw Firecrawl captures belong in `.catalog-work/`, not Git.
