# Duffel Flights Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Secondary comparison source if Amadeus coverage or terms are insufficient.
- Production role: Strong option if Trail Planner later sells or manages bookings.
- Confidence: Medium; docs are clear, but product fit depends on search-to-book economics.

## Access

- Access model: API account with bearer token.
- Auth required: Yes.
- Cost/pricing: Pricing page lists search-to-book-ratio based fees above threshold.
- Rate limits: Account/plan dependent.
- Terms reviewed: https://duffel.com/pricing
- Storage/cache permission: Treat offers as expiring commerce records.
- Attribution: Internal source provenance.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Purchasable offers | Yes | More booking-oriented than planning-only search. |
| Price/currency | Yes | Includes offer amount and expiry. |
| Segments/slices | Yes | Good itinerary structure. |
| Planning-only broad search | Risky | Search economics may penalize high search volume without bookings. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| AAL to BGO | Script only | `raw/source-access.json` | `normalized/access-verdict.json` | No token available. |

## Technical Limitations

- Booking-grade APIs often assume a commerce funnel; Trail Planner may generate many searches per booking.
- Need clear permission for storing sampled offers and showing stale planning estimates.

## Opportunities

- Best fit if booking becomes a product goal.
- Useful cross-check against Amadeus on price realism and route coverage.

## Integration Notes

- Endpoint/feed: `/air/offer_requests?return_offers=true`
- Query shape: Slices, passengers, cabin class.
- Response format: JSON.
- Update cadence: Live offer request.
- Error handling: Store offer expiry and separate no-offer from errors.
- Required attribution/provenance: Query, returned-at, expiry, provider.

## Next Step

- Run side-by-side with Amadeus for the same routes only after confirming search economics fit non-booking planning.
