# EU Weekly Oil Bulletin Fuel Price Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Country-average fuel assumptions for EU legs.
- Production role: Weekly import for EU countries, supplemented by manual/non-EU sources.
- Confidence: Medium; official source, but parsing XLSX layout needs hardening.

## Access

- Access model: Public European Commission XLSX downloads.
- Auth required: No.
- Cost/pricing: Free.
- Rate limits: Not an API; fetch weekly or manually.
- Terms reviewed: https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en
- Storage/cache permission: Public official bulletin; keep source file and retrieval metadata.
- Attribution: European Commission Weekly Oil Bulletin.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Petrol price by EU country | Yes | Euro-super 95, EUR per 1000 l. |
| Diesel price by EU country | Yes | Automotive gas oil, EUR per 1000 l. |
| Taxes included/excluded | Yes | Separate files on the source page. |
| Norway/UK/Iceland/Switzerland | No | Need separate defaults or national sources. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| EU driving-cost countries | Complete | `raw/sample-weekly-oil-bulletin-prices-with-taxes.xlsx` | `normalized/sample-eu-fuel-price-rows.json` | Includes Denmark, Sweden, Germany, France, Italy, Spain. |

## Technical Limitations

- XLSX layout and download IDs can change; production should pin parsing by header labels and validate expected country count.
- It does not cover key non-EU hiking regions: Norway, Iceland, Switzerland, and the UK.

## Opportunities

- Good official baseline for EU car-cost estimates.
- Combine with user fuel economy and official exchange-rate POC for DKK estimates.

## Integration Notes

- Endpoint/feed: Weekly Oil Bulletin page with XLSX attachments.
- Query shape: Fetch page, locate latest "prices with taxes" XLSX, parse first sheet.
- Response format: HTML plus XLSX.
- Update cadence: Weekly.
- Error handling: Keep last good country table, mark stale if older than two weeks.
- Required attribution/provenance: Source URL, XLSX URL, retrieval timestamp.

## Next Step

- Add national/default fuel sources for Norway, UK, Switzerland, and Iceland before relying on this for full trip costs.
