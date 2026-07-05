# Ferry Operator Websites Analysis

## Verdict

- Verdict: manual_only
- MVP role: Source-linked manual ferry segment assumptions for Denmark-Norway car trips.
- Production role: Fallback and validation source even if Direct Ferries access is approved.
- Confidence: Medium for routes/schedules, low for cached price estimates without a date-specific manual check.

## Access

- Access model: Public route/timetable/booking pages.
- Auth required: No for viewing; booking flows may vary.
- Cost/pricing: Dynamic displayed prices; no stable public API found.
- Rate limits: Not applicable; do not scrape.
- Terms reviewed: Operator public pages.
- Storage/cache permission: Store structured manual assumptions and source links, not scraped booking content.
- Attribution: Link source page per ferry segment.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Route existence | Yes | Public route pages. |
| Approximate duration | Yes | Public pages/timetables. |
| Date-specific schedule | Manual | Needs page/booking check. |
| Vehicle/passenger price | Manual | Dynamic and assumption-heavy. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Hirtshals-Kristiansand/Larvik | Manual source model | `raw/source-access.json` | `normalized/sample-ferry-assumptions.json` | Good enough for MVP assumptions with source links. |

## Technical Limitations

- Scraping booking flows is fragile and legally risky.
- Prices depend on date, vehicle, passengers, cabin/seating, pets, and fare class.

## Opportunities

- Manual assumptions can cover the few MVP Denmark-Norway routes with transparent confidence labels.

## Integration Notes

- Endpoint/feed: Public operator pages.
- Query shape: Manual trip-window check.
- Response format: Human web pages.
- Update cadence: Per planning window or seasonal refresh.
- Error handling: Mark ferry cost confidence low if no recent manual check.
- Required attribution/provenance: Operator URL, checked date, vehicle/passenger assumption.

## Next Step

- Build a small manual ferry assumptions table for standard trip windows and vehicle profiles.
