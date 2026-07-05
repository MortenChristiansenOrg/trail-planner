# Navitia Analysis

## Verdict

- Verdict: blocked
- MVP role: Possible broader public-transport fallback for Scotland/Alps where national APIs are fragmented.
- Production role: Region-dependent hosted transit planner if coverage and commercial terms fit.
- Confidence: Low-medium until coverage is tested.

## Access

- Access model: API key with Basic HTTP authentication.
- Auth required: Yes.
- Cost/pricing: To confirm.
- Rate limits: To confirm.
- Terms reviewed: https://doc.navitia.io/
- Storage/cache permission: To confirm.
- Attribution: Navitia/operator attribution likely required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Journeys | Expected | Requires coverage ID and key. |
| Stops/routes/schedules | Expected | Region-dependent. |
| Scotland/Alps coverage | Unknown | Must be verified. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Scottish Highlands / Alps valley access | Blocked | None | `normalized/access-blocked.json` | Requires key and coverage discovery. |

## Technical Limitations

- Coverage is not guaranteed in the target hiking regions.
- Commercial/cache terms need explicit review.

## Opportunities

- Could reduce per-country API fragmentation if target regions are covered.

## Integration Notes

- Endpoint/feed: `https://api.navitia.io/v1/coverage/{coverage}/journeys`
- Query shape: coverage-specific journey requests.
- Response format: JSON/HATEOAS.
- Update cadence: Provider-dependent.
- Error handling: key, coverage missing, no journey, stale data.
- Required attribution/provenance: coverage ID, source terms, retrieval timestamp.

## Next Step

- Obtain key, enumerate coverage, then test Scotland and one Alps/Dolomites valley.
