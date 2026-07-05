# DNT Cabins Analysis

## Verdict

- Verdict: manual_only
- MVP role: curated official cabin links, cabin type, and route-area assumptions.
- Production role: direct adapter only if DNT grants API/structured-data permission.
- Confidence: medium.

## Access

- Access model: public pages and official booking site.
- Auth required: booking/payment flows may require user/session interaction.
- Cost/pricing: cabin and membership pricing varies.
- Rate limits: not applicable for manual use.
- Terms reviewed: https://www.dnt.no/om-dnt/english/about-the-dnt-cabins/ and https://www.dnt.no/om-dnt/english/routes-and-cabins/
- Storage/cache permission: do not scrape/copy detailed content without permission.
- Attribution: link to official DNT pages.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Cabin types | Yes/manual | Staffed, self-service, no-service. |
| Booking availability | Manual | Official booking site can be linked/checked by user. |
| Prices | Manual | Membership and meal assumptions need curation. |
| Coordinates | Partial | Use DNT/UT.no links or OSM candidates with source links. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen/Jotunheimen | Manual | `raw/access-check.md` | `normalized/manual-fallback.json` | Use Gjendesheim/nearby official links manually. |

## Technical Limitations

- No public cabin availability API was identified in this pass.
- Booking/payment flows are not appropriate scraping targets.

## Opportunities

- Store official cabin links and manual opening/booking confidence.
- Pair OSM location candidates with official DNT URLs.

## Integration Notes

- Endpoint/feed: official DNT pages/booking site manually.
- Query shape: manual search by cabin/area/date.
- Response format: manual evidence.
- Update cadence: manual refresh before trip.
- Error handling: show booking availability as unknown unless manually checked.
- Required attribution/provenance: DNT source link.

## Next Step

- Create a curated DNT cabin table for Besseggen and Romsdalseggen seed routes.
