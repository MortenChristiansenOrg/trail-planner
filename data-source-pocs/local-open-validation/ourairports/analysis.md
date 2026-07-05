# OurAirports Analysis

## Verdict

- Verdict: viable
- MVP role: Static airport metadata seed table.
- Production role: Maintain candidate airport list and coordinates for flight search/routing.
- Confidence: high for basic metadata, medium for completeness/freshness.

## Access

- Access model: Public CSV download.
- Auth required: No.
- Cost/pricing: Free public dataset.
- Rate limits: Treat as static data; do not repeatedly fetch in app runtime.
- Terms reviewed: Dataset source referenced; license/terms must be pinned before production.
- Storage/cache permission: Appropriate for cached static seed data after license confirmation.
- Attribution: Record OurAirports and dataset URL.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| IATA/ICAO identifiers | yes | IATA present for many commercial airports. |
| Coordinates | yes | Good for routing and map display. |
| Airport type | yes | Helps filter small/closed airports. |
| Municipality/country | yes | Useful labels. |
| Live routes/prices | no | Needs flight provider. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Candidate airports | success | `raw/airports.csv` | `normalized/candidate-airports.json` | Extracts Nordic/UK/Alps/Iceland airport set. |

## Technical Limitations

- Static metadata does not prove current commercial flight availability.
- Some fields can be stale or community-maintained.
- Need an internal allowlist rather than blindly using every nearby airport.

## Opportunities

- Low-friction seed for Amadeus/Duffel flight searches and airport-to-trailhead transfer calculations.
- Can be committed as normalized seed data with provenance.

## Integration Notes

- Endpoint/feed: `https://davidmegginson.github.io/ourairports-data/airports.csv`
- Query shape: full CSV download, local filter by IATA.
- Response format: CSV.
- Update cadence: Static periodic refresh.
- Error handling: Validate IATA uniqueness and coordinates.
- Required attribution/provenance: Dataset URL, retrieval time, license.

## Next Step

- Expand airport allowlist by target region and add nearest-trailhead transfer tests.

