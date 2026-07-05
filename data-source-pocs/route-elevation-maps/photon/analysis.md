# Photon Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Candidate geocoder/autocomplete if hosted or self-hosted.
- Production role: Self-hosted Photon or hosted provider; do not depend on demo endpoint.
- Confidence: High for software fit, medium for public endpoint limits.

## Access

- Access model: Open-source software; public demo endpoint exists.
- Auth required: No for tested demo endpoint.
- Cost/pricing: Software Apache-2.0; hosting cost if self-hosted.
- Rate limits: Public demo should be treated as limited/no-SLA.
- Terms reviewed: https://github.com/komoot/photon
- Storage/cache permission: OSM/ODbL applies to OSM-derived data.
- Attribution: OSM attribution required when displaying OSM-derived results.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Forward geocoding | Yes | GeoJSON features with OSM IDs. |
| Location-biased search | Yes | Tested with lat/lon bias. |
| Autocomplete | Yes | Main product fit. |
| Reverse geocoding | Possible | Not tested here. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | Success | raw/sample-gjendesheim.json | normalized/sample-place-search.json | Found multiple Gjendesheim OSM features. |
| Trolltunga | Success | raw/sample-skjeggedal.json | normalized/sample-place-search.json | Found Skjeggedal where Nominatim query failed. |
| Ben Nevis CMD | Success | raw/sample-fort-william.json | normalized/sample-place-search.json | Found Fort William and nearby features. |

## Technical Limitations

- Public demo endpoint is not a production dependency.
- Self-hosting needs OpenSearch and an OSM/Nominatim-derived import pipeline.

## Opportunities

- Strong candidate for trailhead/place autocomplete.
- Can be region-scoped for Europe to reduce infrastructure size.

## Integration Notes

- Endpoint/feed: `https://photon.komoot.io/api/` for demo; self-hosted for production.
- Query shape: Text query plus optional lat/lon bias.
- Response format: GeoJSON FeatureCollection.
- Update cadence: Import/index dependent.
- Error handling: Backoff, dedupe OSM objects, rank by route context.
- Required attribution/provenance: OSM attribution and ODbL provenance.

## Next Step

- Test a self-hosted European or Nordic Photon extract if geocoding becomes a core app workflow.
