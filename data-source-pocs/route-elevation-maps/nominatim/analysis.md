# Nominatim Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Low-volume backend enrichment or manual curation helper.
- Production role: Hosted provider or self-hosted Nominatim, not public endpoint.
- Confidence: High for access policy, medium for trailhead recall.

## Access

- Access model: Public endpoint for light usage; self-hostable software.
- Auth required: No for public endpoint.
- Cost/pricing: Public endpoint free but usage constrained.
- Rate limits: Public policy requires light use and no heavy autocomplete/bulk behavior.
- Terms reviewed: https://operations.osmfoundation.org/policies/nominatim/
- Storage/cache permission: OSM/ODbL applies to OSM-derived results.
- Attribution: OSM attribution required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Forward geocoding | Yes | Place names and OSM IDs. |
| Reverse geocoding | Yes | Not tested here. |
| Autocomplete | No | Public policy is not suitable for app autocomplete. |
| Trailhead matching | Partial | Query wording matters. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | Success | raw/sample-gjendesheim.json | normalized/sample-place-search.json | Found Gjendesheim. |
| Trolltunga | Weak | raw/sample-skjeggedal.json | normalized/sample-place-search.json | `Skjeggedal, Odda, Norway` returned no results. |
| Ben Nevis CMD | Success | raw/sample-fort-william.json | normalized/sample-place-search.json | Found Fort William town/station. |

## Technical Limitations

- Public service is explicitly not for high-volume app search.
- Search quality can be sensitive to administrative wording.

## Opportunities

- Good manual enrichment/debug tool.
- Self-hosting remains viable if OSM import pipeline is already planned.

## Integration Notes

- Endpoint/feed: `https://nominatim.openstreetmap.org/search`
- Query shape: Place text, JSON format, limit.
- Response format: JSON array.
- Update cadence: Live OSM-derived index, service-dependent.
- Error handling: Respect policy, user agent, backoff, and query fallbacks.
- Required attribution/provenance: OSM attribution and ODbL provenance.

## Next Step

- Compare hosted Nominatim providers or self-hosting against Photon for trailhead autocomplete.
