# Quality Signals Analysis

## Verdict

- Verdict: `viable_with_limits`
- MVP role: Explainable ranking hints without proprietary reviews.
- Production role: Derived signal pipeline with provenance, user preference weighting, and manual override/review.
- Confidence: Medium for qualitative ordering, low for exact numeric scores.

## Access

- Access model: Derived from owned/manual seed data, OSM POIs, and Commons metadata.
- Auth required: No.
- Cost/pricing: No direct cost.
- Rate limits: Inherited from source POCs.
- Terms reviewed: Inherited from OSM, Commons, and manual source registry.
- Storage/cache permission: Store derived signals with source lineage.
- Attribution: Attribute underlying evidence, especially OSM and Commons.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Visual evidence available | Yes | Commons category sample can support candidate evidence. |
| Mapped viewpoint/tourism POIs | Yes | OSM sample provides route-area hints. |
| Iconic feature/ridge/arete | Yes | Manual seed tags for MVP; later derive some from route names/tags. |
| Water/lake contrast | Manual now | Later derive from hydrography and viewshed. |
| Logistics complexity | Partial | Manual now; OSM can identify ferry/transit/hut hints but not schedules. |
| Crowding/capacity risk | Manual only | Needs parking, permits, bookings, official warnings, or allowed popularity proxy. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen/Trolltunga/Ben Nevis CMD | Complete sample | `raw/scoring-criteria.json` | `normalized/quality-signals.sample.json` | Scores are prototype explainability examples, not production truth. |

## Technical Limitations

- Numeric quality scores are inherently subjective and should not hide the underlying evidence.
- Manual tags can encode editor bias; production needs review history and user-preference weighting.
- OSM/Commons presence can bias toward popular or well-mapped places.
- Safety, closures, and conditions must be separate hard filters, not quality boosts.

## Opportunities

- Rank early candidates without scraping reviews from AllTrails/Komoot/Google.
- Explain why a route appears: ridge, iconic feature, visual evidence, huts, transit complexity.
- Let users tune ranking toward solitude, logistics simplicity, scenery, multi-day trips, or public transport.

## Integration Notes

- Endpoint/feed: Internal derived JSON.
- Query shape: Join by `route_id`.
- Response format: JSON.
- Update cadence: Recompute when seed, OSM, Commons, or user preferences change.
- Error handling: Hide/gray scores when provenance inputs are stale or missing.
- Required attribution/provenance: Store score basis and evidence IDs, not just the final number.

## Next Step

- Replace single sample scores with a transparent weighted formula and field-level evidence IDs.
