# OurAirports Airport Metadata Analysis

## Verdict

- Verdict: viable
- MVP role: Seed fixed origin and destination airport sets for flight offer searches and airport-to-trailhead transfer planning.
- Production role: Static airport reference table refreshed periodically.
- Confidence: High for IATA, coordinates, country, and municipality; medium for service flags and route relevance.

## Access

- Access model: Public CSV download.
- Auth required: No.
- Cost/pricing: Free.
- Rate limits: Not published as an API quota; use periodic downloads, not request-time dependency.
- Terms reviewed: https://ourairports.com/data/
- Storage/cache permission: Public CSV dump is intended for reuse; credit requested but not required.
- Attribution: Credit OurAirports in internal provenance and optionally UI/source docs.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| IATA/ICAO | Yes | IATA is the main join key for flight APIs. |
| Coordinates | Yes | Good for transfer/routing calculations. |
| Airport type | Yes | Large/medium/small airport classification. |
| Scheduled service | Partial | Useful hint, but validate against actual flight offer coverage. |
| Live route availability | No | Must come from flight APIs. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Aalborg and target regions | Complete | `raw/sample-candidate-airports.csv` | `normalized/sample-candidate-airports.json` | Covers Denmark origins, Norway, Scotland, Iceland, Alps, Dolomites, and Pyrenees candidates. |

## Technical Limitations

- The dataset is static metadata, not route availability.
- Some fields are community-maintained; confirm critical airports against flight-offer source coverage.
- `scheduled_service` should be treated as a hint, not a filter hard stop.

## Opportunities

- Keep a curated airport seed list separate from live flight provider availability.
- Use coordinates for airport-to-trailhead ground-transfer estimates.

## Integration Notes

- Endpoint/feed: `https://ourairports.com/airports.csv`
- Query shape: Download CSV, filter by curated IATA list.
- Response format: CSV.
- Update cadence: OurAirports says data dumps are updated nightly.
- Error handling: Keep last good airport seed table.
- Required attribution/provenance: Include source URL and retrieval timestamp.

## Next Step

- Add a curated `airport_role` and `target_region` table in product data, then validate each IATA code against Amadeus flight-offer coverage.
