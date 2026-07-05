# OpenMapTiles Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Fallback, not first implementation.
- Production role: Self-hosted vector tile pipeline if SaaS is unsuitable.
- Confidence: Medium.

## Access

- Access model: Open-source schema/tools and self-hosting.
- Auth required: No for open-source tooling.
- Cost/pricing: Infrastructure and update pipeline cost.
- Rate limits: Self-hosted.
- Terms reviewed: https://openmaptiles.org/docs/
- Storage/cache permission: OSM ODbL plus OpenMapTiles attribution obligations.
- Attribution: OpenMapTiles and OpenStreetMap contributors for maps derived from OSM/OpenMapTiles.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Vector tiles | Yes | Generate from OSM extracts. |
| Outdoor-specific styling | Partial | Need style/schema choices. |
| Geocoding | No | Separate Nominatim/Photon needed. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Norway/DK tile sample | Not run | raw/access-check.json | normalized/source-verdict.json | Operationally heavy for first pass. |

## Technical Limitations

- Requires tile generation, hosting, CDN/cache, and updates.
- More operational work than MapTiler Cloud for early product proof.

## Opportunities

- Cost/privacy control at scale.
- Pairs with MapLibre cleanly.

## Integration Notes

- Endpoint/feed: Self-hosted vector tile server.
- Query shape: `{z}/{x}/{y}.pbf` tile requests.
- Response format: Vector tiles plus style JSON.
- Update cadence: OSM extract update pipeline.
- Error handling: Missing tiles, stale imports, tile server capacity.
- Required attribution/provenance: OSM and OpenMapTiles attribution.

## Next Step

- Defer until hosted tile cost or data-control needs justify the operational work.
