# Parking And Trailhead Fees Analysis

## Verdict

- Verdict: manual_only
- MVP role: Manual source-linked parking, toll-road, and shuttle-fee assumptions for high-impact trailheads.
- Production role: Curated per-route practical-cost table with periodic review.
- Confidence: Medium for operational rules; low for exact price unless checked for the trip window.

## Access

- Access model: Official trail/parking/operator web pages.
- Auth required: No for information pages; booking/payment may require separate flows.
- Cost/pricing: Fragmented and seasonal.
- Rate limits: Not applicable; do not scrape booking flows.
- Terms reviewed: Source pages listed in `raw/source-access.json`.
- Storage/cache permission: Store structured assumptions and links, not copied page content.
- Attribution: Link the source page per assumption.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Parking location/rules | Yes | Official pages cover most MVP cases. |
| Fees | Manual | Often visible but should be date/season checked. |
| Shuttle constraints | Manual | Critical for Besseggen, Trolltunga, and Romsdalseggen. |
| Machine-readable feed | No | None found. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Trolltunga/Besseggen/Romsdalseggen/Ben Nevis | Manual source model | `raw/source-access.json` | `normalized/sample-parking-assumptions.json` | Use manual confidence labels. |

## Technical Limitations

- Rules and prices change seasonally.
- Parking availability can be capacity-limited and not represented as static data.

## Opportunities

- Small curated table can handle the routes that materially affect cost and feasibility.
- Pair with OSM parking POIs for map display, but use official pages for fees.

## Integration Notes

- Endpoint/feed: Official pages.
- Query shape: Manual review per route and season.
- Response format: Human web pages.
- Update cadence: Seasonal and before publishing a trip plan.
- Error handling: Display unknown/needs-check if stale.
- Required attribution/provenance: Source URL, checked date, fee assumptions, vehicle assumptions.

## Next Step

- Create route-level fee records with `valid_from`, `valid_to`, `checked_at`, `vehicle_type`, and `confidence`.
