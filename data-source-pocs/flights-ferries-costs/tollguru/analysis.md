# TollGuru Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Optional comparison source; not needed if manual/default car-cost model is acceptable.
- Production role: Paid toll/fuel-cost estimator for Europe routes if coverage and pricing fit.
- Confidence: Medium until Aalborg-Norway and Aalborg-Alps routes are tested.

## Access

- Access model: Paid SaaS API key.
- Auth required: Yes.
- Cost/pricing: Public pricing page lists paid monthly plans.
- Rate limits: Plan transaction limits.
- Terms reviewed: https://tollguru.com/toll-api-docs and pricing page.
- Storage/cache permission: Must confirm in terms/account.
- Attribution: Internal source provenance.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Toll costs | Yes | Advertised route toll calculation. |
| Fuel costs | Yes | Uses fuel assumptions and route distance. |
| Vehicle classes | Yes | Important for cars vs campervans. |
| Ferry costs | Unclear | Needs route-specific test; may not replace ferry operator data. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Aalborg to Gjendesheim | Script only | `raw/source-access.json` | `normalized/access-verdict.json` | No API key available. |

## Technical Limitations

- Paid API may duplicate routing-provider distance data.
- Need to verify European toll/vignette/ferry handling for Norway, Alps, and bridge crossings.

## Opportunities

- Could improve confidence for road-trip cost estimates when the app moves beyond rough assumptions.

## Integration Notes

- Endpoint/feed: TollGuru origin-destination-waypoints API.
- Query shape: Origin, destination, vehicle profile, fuel assumptions.
- Response format: JSON.
- Update cadence: Live route-cost calculation.
- Error handling: Fall back to internal route distance plus manual toll assumptions.
- Required attribution/provenance: Vehicle profile, route, fuel assumption, source, retrieved timestamp.

## Next Step

- Test against manual toll/ferry calculations only after an API key is available.
