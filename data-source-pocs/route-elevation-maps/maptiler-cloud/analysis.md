# MapTiler Cloud Analysis

## Verdict

- Verdict: blocked
- MVP role: Hosted maps/geocoding/static maps if SaaS dependency is acceptable.
- Production role: Strong vendor candidate with plan/cost review.
- Confidence: Medium.

## Access

- Access model: API-key SaaS.
- Auth required: Yes.
- Cost/pricing: Plan-dependent; pricing page reviewed.
- Rate limits: Plan-dependent.
- Terms reviewed: https://docs.maptiler.com/cloud/api/, https://www.maptiler.com/terms/cloud/, https://www.maptiler.com/copyright/
- Storage/cache permission: Must be verified per service/plan.
- Attribution: MapTiler maps require visible attribution such as MapTiler and OSM contributors unless custom permission applies.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Vector/raster tiles | Yes | Requires key. |
| Outdoor/topographic styles | Yes | Product-fit likely good. |
| Geocoding | Yes | Needs key and plan review. |
| Static maps | Yes | Docs state static maps require paid plan. |
| Elevation | Yes | Covered separately in MapTiler Elevation. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen map/geocode | Blocked | raw/access-check.json | normalized/source-verdict.json | Requires API key. |

## Technical Limitations

- Vendor lock-in and usage costs must be modeled early.
- API keys need domain restrictions and secret handling.

## Opportunities

- Fastest path to polished outdoor maps and shareable static maps.

## Integration Notes

- Endpoint/feed: `https://api.maptiler.com/`
- Query shape: Style/tile/geocoding/static map endpoints with key.
- Response format: Tiles, JSON, images.
- Update cadence: Vendor-managed.
- Error handling: Key, quota, attribution, overuse.
- Required attribution/provenance: MapTiler plus underlying data attribution.

## Next Step

- Create key-gated POC with `.env.example` once account/plan is approved.
