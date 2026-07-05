# GraphHopper Analysis

## Verdict

- Verdict: blocked
- MVP role: Hosted road routing comparison candidate.
- Production role: Possible paid hosted routing provider; open-source engine is also a self-host option.
- Confidence: Medium.

## Access

- Access model: Account and API key required.
- Auth required: Yes.
- Cost/pricing: Free plan exists but official pricing states the Free Plan is non-commercial.
- Rate limits: Credits/day and plan limits apply.
- Terms reviewed: https://www.graphhopper.com/terms/ and pricing page.
- Storage/cache permission: Needs paid-plan terms review before production storage.
- Attribution: Attribution discount exists; OSM/source attribution should be planned.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Driving duration/distance | Expected | Script normalizes first path. |
| Geometry | Expected | `points_encoded=false` gives coordinates. |
| Matrices/isochrones | Expected | Credit-based limits. |
| Commercial hosted use | Paid only | Free package is non-commercial. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Aalborg to Gjendesheim | Blocked | None | None | Requires `GRAPHHOPPER_API_KEY`. |
| Aalborg to Odda | Blocked | None | None | Requires `GRAPHHOPPER_API_KEY`. |

## Technical Limitations

- Hosted free tier does not fit commercial MVP use.
- Long route/ferry behavior must be compared manually against other providers.

## Opportunities

- Clean hosted API for direct comparison with openrouteservice.
- Paid plans may be simpler than self-hosting if request volume is modest.

## Integration Notes

- Endpoint/feed: `https://graphhopper.com/api/1/route`
- Query shape: GET with repeated `point`, `profile=car`, and API key.
- Response format: JSON.
- Update cadence: Hosted OSM-derived service.
- Error handling: quota, plan, and route-not-found errors.
- Required attribution/provenance: plan, source terms URL, retrieval timestamp.

## Next Step

- Run with a paid/commercial-compatible key before considering production use.
