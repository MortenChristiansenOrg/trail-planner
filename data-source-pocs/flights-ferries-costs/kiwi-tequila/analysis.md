# Kiwi / Tequila Analysis

## Verdict

- Verdict: blocked
- MVP role: Do not depend on it.
- Production role: Reconsider if Kiwi partner access is approved and flexible search is important.
- Confidence: Medium.

## Access

- Access model: Partner/affiliate API key.
- Auth required: Yes.
- Cost/pricing: Not clear enough from public docs for MVP planning.
- Rate limits: Partner/account dependent.
- Terms reviewed: Kiwi/Margarita docs and Kiwi partner pages.
- Storage/cache permission: Must be confirmed in partner agreement.
- Attribution: To be confirmed.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Flexible flight search | Likely | Historically a strength of Tequila. |
| Prices | Likely | Requires approved API key. |
| Public unauthenticated sample | No | Not useful for this POC. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Access check | Blocked | `raw/source-access.json` | `normalized/access-verdict.json` | No public POC run. |

## Technical Limitations

- Current access path is not clear enough to use as a foundation.
- Terms and minimum traffic/affiliate expectations may not fit an early planning app.

## Opportunities

- Flexible search could be valuable later if approved.

## Integration Notes

- Endpoint/feed: Tequila REST API, subject to current partner docs.
- Query shape: Locations/search endpoints.
- Response format: JSON.
- Update cadence: Live search.
- Error handling: To be designed after access approval.
- Required attribution/provenance: To be confirmed.

## Next Step

- Apply/check partner eligibility only after Amadeus route coverage has been tested.
