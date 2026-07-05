# OSM POI Amenities Analysis

## Verdict

- Verdict: `viable_with_limits`
- MVP role: Route-buffer enrichment for amenities and logistics evidence.
- Production role: Batch/import OSM extracts or a dedicated Overpass-compatible service, not repeated public Overpass calls.
- Confidence: Medium for mapped POIs, low for completeness.

## Access

- Access model: Public Overpass API endpoint.
- Auth required: No.
- Cost/pricing: No direct API fee for public endpoint.
- Rate limits: Public-service fair use; requests should be serialized and cached.
- Terms reviewed: https://wiki.openstreetmap.org/wiki/Overpass_API and https://www.openstreetmap.org/copyright
- Storage/cache permission: OSM data can be stored with ODbL compliance and attribution review.
- Attribution: `© OpenStreetMap contributors`.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Parking | Yes | Strong around towns/trailheads; may overcount urban parking within broad radius. |
| Toilets | Yes | Useful when mapped, incomplete in remote areas. |
| Drinking water | Partial | Sparse and inconsistent. |
| Huts/campsites/shelters | Yes | Good for Norway/UK samples where mapped. |
| Viewpoints/information | Yes | Useful quality/logistics hints, not proof of scenic value. |
| Transit stops/ferry terminals | Yes | Good for anchors, but schedules require another source. |
| Object provenance | Yes | OSM type, ID, tags, and element timestamp are preserved. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | 64 features | `raw/sample-besseggen.json` | `normalized/sample-besseggen.json` | Strong mix: huts, campsites, ferry terminal, transit stops, information, viewpoints. |
| Trolltunga | 16 features | `raw/sample-trolltunga.json` | `normalized/sample-trolltunga.json` | Sparse but useful: viewpoints, shelters, wilderness huts, information. |
| Ben Nevis CMD | 160 features | `raw/sample-ben-nevis-cmd.json` | `normalized/sample-ben-nevis-cmd.json` | Many town/valley parking and transit features; needs route-corridor filtering. |

## Technical Limitations

- Circular radius around a trailhead is too blunt for mountain routes; it can include irrelevant valley/town amenities.
- OSM amenity completeness varies by mapper activity and country.
- OSM POIs are facts about mapped objects, not availability, opening hours, capacity, safety, or service reliability.
- Public Overpass should remain an experiment and debugging source; production should use extracts or a paid/owned service.

## Opportunities

- Use OSM POIs as explainable dossier facts: "parking nearby", "hut on route", "mapped viewpoint".
- Derive route-quality hints from `tourism=viewpoint`, `tourism=alpine_hut`, ferries, campsites, and transit links.
- Combine with route geometry later to filter POIs by corridor distance instead of trailhead radius.

## Integration Notes

- Endpoint/feed: `https://overpass-api.de/api/interpreter`
- Query shape: Overpass QL `nwr(around:radius,lat,lon)` for selected amenity/tourism/transit tags.
- Response format: JSON with OSM object metadata and tags.
- Update cadence: Live-ish OSM database replication; exact instance freshness varies.
- Error handling: Handle HTTP 429/timeouts; cache successful responses.
- Required attribution/provenance: Keep OSM IDs, timestamps, query, retrieval time, ODbL attribution.

## Next Step

- Re-run against actual route geometry buffers once GPX/OSM route lines are available, then compare false positives against this radius sample.
