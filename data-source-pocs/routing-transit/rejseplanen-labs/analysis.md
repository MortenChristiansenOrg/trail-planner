# Rejseplanen Labs Analysis

## Verdict

- Verdict: blocked
- MVP role: Danish origin access from Aalborg to airports, ferry terminals, and rail hubs.
- Production role: Primary Denmark public transport journey planner if access and terms fit.
- Confidence: Medium.

## Access

- Access model: Labs registration/account access.
- Auth required: Expected.
- Cost/pricing: To confirm during registration.
- Rate limits: To confirm during registration.
- Terms reviewed: Official Rejseplanen Labs article.
- Storage/cache permission: To confirm.
- Attribution: Rejseplanen/operator attribution likely required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Danish stop-to-stop journeys | Expected | Key MVP need for Aalborg origin legs. |
| GTFS | Expected | Labs docs mention GTFS. |
| Realtime/disruptions | To confirm | Depends on Labs endpoint. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Aalborg to AAL/BLL/CPH/Hirtshals | Blocked | None | `normalized/access-blocked.json` | Registration needed. |

## Technical Limitations

- Denmark-only coverage; does not solve Norway/Scotland/Alps last mile.
- Terms and cache rights need explicit review after account approval.

## Opportunities

- Critical for home-origin non-car trip plans.
- GTFS may feed future OTP/R5/Valhalla experiments.

## Integration Notes

- Endpoint/feed: Account-specific Labs endpoint/GTFS.
- Query shape: To confirm.
- Response format: To confirm.
- Update cadence: To confirm.
- Error handling: account quota, invalid endpoint, stale schedules.
- Required attribution/provenance: source URL, account terms, schedule date.

## Next Step

- Register for Labs access and run Aalborg-to-airport/ferry-terminal samples.
