# Direct Ferries Connect Analysis

## Verdict

- Verdict: blocked
- MVP role: Do not block on it; use manual ferry assumptions and operator links.
- Production role: Candidate live ferry inventory/pricing source if partner access is approved.
- Confidence: Medium.

## Access

- Access model: B2B partner/commercial REST API.
- Auth required: Yes.
- Cost/pricing: Not public enough for implementation decision.
- Rate limits: Partner agreement dependent.
- Terms reviewed: https://www.directferriesconnect.com/connect
- Storage/cache permission: Must be confirmed in partner agreement.
- Attribution: To be confirmed.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Ferry routes/operators | Likely | Advertised broad coverage. |
| Live schedules/rates | Likely | Booking-path positioning implies inventory and rates. |
| Public unauthenticated sample | No | Not testable here. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Access check | Blocked | `raw/source-access.json` | `normalized/access-verdict.json` | Requires partner approval. |

## Technical Limitations

- Commercial terms may require a booking flow, not planning-only estimates.
- Dynamic vehicle/passenger pricing must be stored as sampled evidence with expiry.

## Opportunities

- Could remove much of the ferry manual-curation burden if partner terms allow planning usage.

## Integration Notes

- Endpoint/feed: Direct Ferries Connect REST API.
- Query shape: To be confirmed after access.
- Response format: JSON/XML to be confirmed.
- Update cadence: Live.
- Error handling: To be designed after access.
- Required attribution/provenance: Query, route, vehicle/passenger assumptions, price timestamp, expiry.

## Next Step

- Contact/apply for partner access only after validating manual ferry modeling needs on Denmark-Norway routes.
