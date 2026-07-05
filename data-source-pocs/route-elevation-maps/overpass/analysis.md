# OpenStreetMap Overpass Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Targeted route/trail inventory lookup and enrichment.
- Production role: Prototype source only; production should cache OSM data and/or use extracts.
- Confidence: High for access, medium for route completeness.

## Access

- Access model: Public API instances.
- Auth required: No.
- Cost/pricing: Free public community infrastructure.
- Rate limits: Public instances use operational limits and may throttle heavy clients.
- Terms reviewed: https://wiki.openstreetmap.org/wiki/Overpass_API, https://www.openstreetmap.org/copyright
- Storage/cache permission: OSM data is ODbL; derived databases need ODbL compliance.
- Attribution: Attribute OpenStreetMap contributors when displayed publicly.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Hiking route relations | Yes | Besseggen sample found `Gjendesheim-Besseggen-Memurubu`. |
| Path geometry | Yes | `out body geom` returns way geometry suitable for samples. |
| Trail difficulty tags | Partial | Depends on mapper coverage (`sac_scale`, `trail_visibility`, `surface`). |
| POIs | Yes | Parking, huts, toilets, shelters, transport nodes when mapped. |
| Route quality/rating | No | Must be curated or derived elsewhere. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | Success | raw/sample-besseggen.json | normalized/sample-besseggen.json | 25 hiking relations, 283 path ways, 6 POIs. |
| Trolltunga | Success | raw/sample-trolltunga.json | normalized/sample-trolltunga.json | 13 hiking relations, 738 path ways, 14 POIs. |
| Ben Nevis CMD | Success | raw/sample-ben-nevis-cmd.json | normalized/sample-ben-nevis-cmd.json | 8 hiking relations, 219 path ways, 6 POIs. |

## Technical Limitations

- Route relations may be incomplete, duplicated, or not aligned with the exact public route description.
- Bounding-box queries include nearby trails that need route matching/scoring.
- Public Overpass is not an unlimited production backend.

## Opportunities

- Use Overpass as the first evidence source for OSM object IDs and tags.
- Seed candidate route extraction, then validate against official pages or GPX imports.

## Integration Notes

- Endpoint/feed: `https://overpass-api.de/api/interpreter`
- Query shape: Small bbox Overpass QL around a route area.
- Response format: OSM JSON with relation/way/node elements.
- Update cadence: Live OSM database replication, instance-dependent.
- Error handling: Back off on HTTP 429/504 and reduce bbox/timeout.
- Required attribution/provenance: OSM attribution and ODbL provenance.

## Next Step

- Build route-relation reconstruction and compare relation geometry against official/GPX route samples.
