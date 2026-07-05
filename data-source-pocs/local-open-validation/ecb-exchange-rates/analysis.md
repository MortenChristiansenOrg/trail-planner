# ECB Exchange Rates Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Official daily reference rates for currency conversion.
- Production role: Baseline exchange-rate provider, potentially supplemented by Danmarks Nationalbank if DKK-first presentation needs official local framing.
- Confidence: high for daily reference rates, low for intraday pricing.

## Access

- Access model: Public XML feed.
- Auth required: No.
- Cost/pricing: Public official feed.
- Rate limits: Treat as daily static data; cache by date.
- Terms reviewed: Source referenced; production attribution/licensing must be confirmed.
- Storage/cache permission: Cache daily retrieved rates with source date.
- Attribution: Record ECB as reference-rate provider.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Daily EUR base rates | yes | Includes DKK, NOK, SEK, GBP, CHF, ISK in the tested feed. |
| DKK conversions | yes | Derive through EUR base rate. |
| Historical series | partial | Separate ECB historical feed/endpoints should be tested if needed. |
| Intraday/live exchange rates | no | Not needed for MVP ballpark estimates. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Daily target currencies | success | `raw/eurofxref-daily.xml` | `normalized/euro-reference-rates.json` | Official daily reference rates. |

## Technical Limitations

- Rates are daily reference values, not live consumer/card exchange rates.
- Feed is EUR-based, so DKK display requires derived cross rates.
- Weekend/holiday updates may not produce a new rate date.

## Opportunities

- Simple, official, cacheable source for MVP cost estimates.
- Can keep estimates transparent by showing rate date and source.

## Integration Notes

- Endpoint/feed: `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`
- Query shape: static daily XML.
- Response format: XML.
- Update cadence: Daily business days.
- Error handling: Use last cached rate if feed unavailable, but display rate date.
- Required attribution/provenance: Provider, retrieval time, rate date, base currency.

## Next Step

- Compare with Danmarks Nationalbank official data and decide which attribution is clearest for Danish users.

