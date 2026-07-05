# OSRM Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Candidate self-host road-routing/matrix engine for high-volume screening.
- Production role: Self-hosted road routing where hosted API cost or terms are a concern.
- Confidence: Medium.

## Access

- Access model: Open-source engine; public demo endpoint exists.
- Auth required: No auth for public demo, but demo should not be treated as production.
- Cost/pricing: Software is open source; hosting and OSM update pipeline are operational costs.
- Rate limits: Public demo limits/availability are not a product guarantee.
- Terms reviewed: https://project-osrm.org/ and official API docs.
- Storage/cache permission: OSM-derived output requires OSM/ODbL attribution and compliance review.
- Attribution: OSM attribution for underlying data.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Road duration | Yes | Saved samples include route duration. |
| Road distance | Yes | Saved samples include route distance. |
| Matrices | Yes | OSRM Table service supports durations/distances. |
| Multimodal/ferries | Limited | Road engine only; ferry handling needs route validation. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Aalborg to Hirtshals | Success | `raw/sample-aalborg-to-hirtshals.json` | `normalized/sample-aalborg-to-hirtshals.json` | Good short road leg. |
| Bergen to Odda | Success | `raw/sample-bergen-to-odda.json` | `normalized/sample-bergen-to-odda.json` | Useful regional road estimate. |

## Technical Limitations

- No public production SaaS terms are implied by the demo server.
- Less suitable for multimodal transit or nuanced hiking approach routing out of the box.

## Opportunities

- Strong fit for self-hosted road matrices once candidate trailheads are known.
- Can be much cheaper than hosted APIs for bulk screening.

## Integration Notes

- Endpoint/feed: self-hosted OSRM HTTP API; demo used `https://router.project-osrm.org`.
- Query shape: `/route/v1/driving/{lon},{lat};{lon},{lat}`
- Response format: JSON.
- Update cadence: Depends on OSM extract refresh.
- Error handling: Check `code` and missing `routes`.
- Required attribution/provenance: OSM attribution, OSRM version, extract date.

## Next Step

- If road matrix volume is high, self-host OSRM on regional OSM extracts and compare against hosted ORS/GraphHopper.
