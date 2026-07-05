# Alpine Hut Systems Analysis

## Verdict

- Verdict: manual_only
- MVP role: curated hut-stage links for selected Dolomites/Alps routes.
- Production role: region-specific adapters only after terms/API permission checks.
- Confidence: medium.

## Access

- Access model: public portals and hut-specific reservation systems.
- Auth required: often yes for reservations.
- Cost/pricing: hut/association-specific.
- Rate limits: not evaluated.
- Terms reviewed: https://www.club-arc-alpin.eu/en/activities/online-reservation-system/
- Storage/cache permission: not confirmed for automated extraction.
- Attribution: link to official association/hut pages.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Hut identity/location | Manual/partial | Often visible on official hut pages. |
| Booking status | Manual/portal | CAA notes traffic-light style availability in participating systems. |
| Prices/opening periods | Manual | Varies by hut and association. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Dolomites sample | Manual | `raw/access-check.md` | `normalized/manual-fallback.json` | Pick route-specific huts during seed curation. |

## Technical Limitations

- Fragmented by country, club, region, and individual hut.
- Reservation portals are designed for users, not bulk planning ingestion.

## Opportunities

- Model hut stages manually first; automate only high-value regions later.
- Link to official reservation pages and show availability confidence separately.

## Integration Notes

- Endpoint/feed: official hut/association pages.
- Query shape: manual by hut/date/party size.
- Response format: manual evidence.
- Update cadence: manual before booking.
- Error handling: availability unknown until checked.
- Required attribution/provenance: source link per hut.

## Next Step

- Select one Dolomites route and create a curated hut-stage table with official links.
