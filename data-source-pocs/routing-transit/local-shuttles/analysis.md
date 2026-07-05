# Local Shuttles And Boats Analysis

## Verdict

- Verdict: manual_only
- MVP role: Required manual/operator-source transport segment layer for named hikes.
- Production role: Source-specific adapters only where operators expose stable APIs/feeds; otherwise curated seasonal records with source links.
- Confidence: High that manual fallback is required.

## Access

- Access model: Public human-readable operator/destination pages.
- Auth required: No for viewed pages; booking systems may require normal customer flow.
- Cost/pricing: Per operator; not normalized here.
- Rate limits: Do not scrape without explicit permission.
- Terms reviewed: Official/operator pages listed in README.
- Storage/cache permission: Store source links and small factual fields; do not copy full timetables without permission review.
- Attribution: Source/operator URL per segment.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Route endpoints | Yes | Enough to model manual segment. |
| Season window | Partial | Besseggen and Romsdalseggen have clear public season notes; Trolltunga needs precise timetable capture. |
| Departure times | Manual | Should link out or capture only allowed minimal fields. |
| Booking requirement | Yes | Operator pages indicate advance/online booking. |
| API/GTFS presence | No in samples | Entur did not return usable last-mile transit for tested cases. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen Gjende boat | Manual source | `raw/sample-source-links.json` | `normalized/sample-local-shuttle-segments.json` | Entur gap; operator page needed. |
| Trolltunga shuttle | Manual source | `raw/sample-source-links.json` | `normalized/sample-local-shuttle-segments.json` | Entur gap; official Trolltunga transport page needed. |
| Romsdalseggen bus | Manual source | `raw/sample-source-links.json` | `normalized/sample-local-shuttle-segments.json` | Entur gap; NOR-WAY page needed. |

## Technical Limitations

- Timetables are seasonal, booking-sensitive, and may change during the season.
- Automated scraping is fragile and not assumed legally safe.
- Manual records need freshness warnings and source-review dates.

## Opportunities

- A small curated table can unblock high-value hikes faster than broad transit feed work.
- Manual records can be used as confidence overlays on Entur-generated trunk trips.

## Integration Notes

- Endpoint/feed: Public operator pages, not APIs.
- Query shape: Manual source review by route/date.
- Response format: Curated JSON.
- Update cadence: Before each season and before showing bookable itinerary dates.
- Error handling: expired season, missing timetable, sold-out/booking required.
- Required attribution/provenance: source URL, retrieval date, confidence, and whether departure times were manually verified.

## Next Step

- Add per-route manual fields: season start/end, first/last departure, booking URL, price notes, and "last checked" date.
