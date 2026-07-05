# Official Exchange Rates Analysis

## Verdict

- Verdict: viable
- MVP role: Convert sampled costs in EUR/NOK/SEK/GBP/CHF/ISK to DKK.
- Production role: Daily reference-rate import with historical snapshots for reproducibility.
- Confidence: High for indicative reference conversion; not suitable as a guaranteed card/payment exchange rate.

## Access

- Access model: Public XML endpoints/pages.
- Auth required: No.
- Cost/pricing: Free.
- Rate limits: Not a high-volume API; fetch daily and cache.
- Terms reviewed: Nationalbanken and ECB exchange-rate pages.
- Storage/cache permission: Reference rates are public statistics; store retrieved snapshots with source/date.
- Attribution: Cite Danmarks Nationalbank as primary DKK source and ECB as cross-check where used.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| DKK per EUR/NOK/SEK/GBP/CHF/ISK | Yes | Nationalbanken quotes DKK per 100 foreign currency units. |
| Rate date | Yes | Latest business-day rate. |
| Historical rates | Likely | Nationalbanken Statbank provides daily/monthly/annual tables; this POC uses current XML only. |
| Transaction rates | No | Display as indicative planning conversion. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| DKK target currencies | Complete | `raw/sample-nationalbanken-currencyrates.xml`, `raw/sample-ecb-eurofxref-daily.xml` | `normalized/sample-dkk-conversions.json` | Latest available rate date in sample: 2026-07-03. |

## Technical Limitations

- Rates are usually business-day reference rates, so weekend runs use the previous business day.
- Transaction costs and card exchange spreads are not represented.

## Opportunities

- Simple, official, cacheable source for every cost estimate.
- ECB cross-check can catch parser or feed mistakes.

## Integration Notes

- Endpoint/feed: `https://www.nationalbanken.dk/api/currencyratesxml?lang=en`
- Query shape: Fetch daily XML and parse target currency rates.
- Response format: XML.
- Update cadence: Daily on business days.
- Error handling: Keep last known rate and mark stale after a threshold.
- Required attribution/provenance: Provider, rate date, retrieved timestamp, terms URL.

## Next Step

- Add historical date support from Nationalbanken Statbank if dossiers need repeatable past-price reproduction.
