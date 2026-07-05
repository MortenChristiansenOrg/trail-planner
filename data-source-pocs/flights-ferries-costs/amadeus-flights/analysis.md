# Amadeus Flight Offers Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Primary live flight offer and price sampler once credentials are available.
- Production role: Flight search provider if self-service terms, quota, and production approval fit planning use.
- Confidence: Medium until real AAL/BLL/CPH/HAM route samples are run.

## Access

- Access model: Self-service API account with OAuth.
- Auth required: Yes.
- Cost/pricing: Free monthly test quota is advertised; production usage and limits need account confirmation.
- Rate limits: Plan/quota based.
- Terms reviewed: https://developers.amadeus.com/pricing
- Storage/cache permission: Treat offer responses as volatile sampled evidence; do not present cached fares as bookable.
- Attribution: Amadeus/source provenance in internal evidence.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Live flight offers | Yes | Credentialed API. |
| Price/currency | Yes | Request DKK where supported. |
| Segments and carriers | Yes | Useful for travel-time and layover scoring. |
| Flexible date windows | Limited | Search specific dates; broader discovery may require multiple calls or other endpoints. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| AAL to BGO | Script only | `raw/source-access.json` | `normalized/access-verdict.json` | No credentials available, so no live offer sample committed. |

## Technical Limitations

- Flight prices are volatile and availability can change immediately.
- Self-service coverage may miss special/private fares.
- API quota can become expensive if used for broad candidate discovery across many dates.

## Opportunities

- Strong first live-price source for MVP because airport metadata can seed controlled route/date calls.
- Useful for comparing drive/ferry versus fly-in trip options.

## Integration Notes

- Endpoint/feed: `/v2/shopping/flight-offers`
- Query shape: IATA origin/destination, departure date, passengers, currency.
- Response format: JSON.
- Update cadence: Live search.
- Error handling: Backoff on quota/rate errors; store no-offer responses separately from API failures.
- Required attribution/provenance: Query date, travel date, source, retrieved timestamp, offer expiry if present.

## Next Step

- Run the POC with test credentials for AAL/BLL/CPH/HAM to OSL/BGO/EDI/VCE/KEF and compare coverage.
