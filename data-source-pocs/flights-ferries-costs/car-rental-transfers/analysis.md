# Car Rental And Airport Transfers Analysis

## Verdict

- Verdict: manual_only
- MVP role: User-configurable rental-car assumptions and public-transport-first comparison.
- Production role: Add live rental/transfer APIs only if fly-in plans become central.
- Confidence: Medium for modeling approach, low for live price without partner data.

## Access

- Access model: Commercial/self-service/partner APIs.
- Auth required: Yes for useful live pricing.
- Cost/pricing: Provider/account dependent.
- Rate limits: Provider/account dependent.
- Terms reviewed: Amadeus Cars and Transfers docs; Booking.com Demand Cars docs.
- Storage/cache permission: Must be confirmed per provider.
- Attribution: Provider provenance if integrated.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Transfer offers | Likely | Amadeus transfer APIs are relevant. |
| Rental-car availability/prices | Partner-gated | Booking/other rental APIs require eligibility. |
| One-way constraints | Provider-specific | Important for trail trips. |
| Manual cost bands | Yes | Sufficient for MVP estimates. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Ben Nevis/Dolomites/Pyrenees fly-in | Manual model | `raw/source-access.json` | `normalized/sample-rental-assumptions.json` | No live credentialed sample. |

## Technical Limitations

- Rental pricing depends on age, license country, insurance, deposit, pickup hours, one-way fees, and vehicle class.
- Live prices can be misleading if shown without the full booking constraints.

## Opportunities

- Start with transparent assumptions and let users override daily rate, fuel economy, and vehicle class.
- Add live API later for high-value airports and regions only.

## Integration Notes

- Endpoint/feed: Amadeus Cars/Transfers or partner rental APIs after access.
- Query shape: Airport, pickup/dropoff date/time, driver/profile assumptions.
- Response format: JSON.
- Update cadence: Live.
- Error handling: Fall back to manual cost band.
- Required attribution/provenance: Query assumptions, provider, retrieved timestamp, expiry.

## Next Step

- Implement assumption schema before pursuing live car-rental partner access.
