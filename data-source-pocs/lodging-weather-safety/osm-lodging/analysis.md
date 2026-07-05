# OSM Lodging Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: discover mapped huts, campsites, hostels, guesthouses, and hotels around trail areas.
- Production role: candidate inventory source backed by local OSM extracts rather than public Overpass.
- Confidence: medium; good location hints, weak operational details.

## Access

- Access model: public Overpass API for POC; OSM extracts preferred for production.
- Auth required: no.
- Cost/pricing: public API has fair-use expectations.
- Rate limits: public Overpass can throttle or reject requests.
- Terms reviewed: https://www.openstreetmap.org/copyright
- Storage/cache permission: ODbL obligations apply.
- Attribution: OpenStreetMap attribution required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Hut/campsite/hotel locations | Yes | Besseggen and Trolltunga returned features. |
| Contact links | Partial | Depends on tags. |
| Reservation/season/capacity | Sparse | Present only when mapped. |
| Live availability/prices | No | Requires booking/hut systems or manual checks. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | OK | `raw/sample-besseggen.json` | `normalized/sample-besseggen.json` | 21 features. |
| Trolltunga | OK | `raw/sample-trolltunga.json` | `normalized/sample-trolltunga.json` | 16 features. |
| Ben Nevis | Limited | `raw/sample-ben-nevis.json` | `normalized/sample-ben-nevis.json` | Public Overpass returned 429 during run. |

## Technical Limitations

- Public Overpass is unreliable for repeated production use.
- OSM does not provide live availability, exact pricing, or legal camping rules.
- Tag completeness varies by region.

## Opportunities

- Use OSM as the first pass for lodging candidates and source links.
- Combine with manual/official data for high-demand routes.
- Move to regional OSM extracts if this becomes core infrastructure.

## Integration Notes

- Endpoint/feed: `https://overpass-api.de/api/interpreter`
- Query shape: route-area radius around coordinates with `tourism` lodging/camping tags.
- Response format: Overpass JSON.
- Update cadence: live-ish OSM snapshot from Overpass.
- Error handling: cache, retry gently, and avoid public Overpass in production.
- Required attribution/provenance: OpenStreetMap contributors and ODbL compliance.

## Next Step

- Re-run Ben Nevis later or via a different Overpass instance; compare against local OSM extract.
