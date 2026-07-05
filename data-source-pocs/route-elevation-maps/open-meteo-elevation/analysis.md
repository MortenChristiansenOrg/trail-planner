# Open-Meteo Elevation Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Quick point-elevation sanity checks for trailheads/high points.
- Production role: Possible supporting source; not the main route-profile engine.
- Confidence: High for access, medium for elevation-profile usefulness.

## Access

- Access model: Public HTTP API.
- Auth required: No for non-commercial use.
- Cost/pricing: Free non-commercial tier; commercial plans available.
- Rate limits: Free terms list 10,000 calls/day, 5,000/hour, 600/minute.
- Terms reviewed: https://open-meteo.com/en/docs/elevation-api, https://open-meteo.com/en/terms
- Storage/cache permission: Free API data under CC BY 4.0 per Open-Meteo terms.
- Attribution: Open-Meteo attribution required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Point elevation | Yes | Batch coordinates supported. |
| Route profile | Partial | Must densify route points and call in batches. |
| DEM metadata | Partial | Docs expose service behavior, not rich per-point metadata. |
| Terrain/ruggedness | No | Must derive from denser DEM/tile data. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | Success | raw/sample-route-points.json | normalized/sample-route-points.json | Gjendesheim 997 m; ridge sample 1698 m. |
| Trolltunga | Success | raw/sample-route-points.json | normalized/sample-route-points.json | Skjeggedal sample 414 m. |
| Ben Nevis CMD | Success | raw/sample-route-points.json | normalized/sample-route-points.json | Summit sample 1286 m, lower than official summit due to DEM/sample. |

## Technical Limitations

- Point-only API encourages noisy route-profile calculations unless we resample/smooth carefully.
- Mountain summits and ridges can differ from official heights depending on DEM resolution and coordinate precision.
- Free terms are non-commercial, so production requires commercial terms or self-hosting.

## Opportunities

- Fast and simple fallback for missing elevation metadata.
- Useful to compare against AWS Terrain Tiles and route-source stated elevations.

## Integration Notes

- Endpoint/feed: `https://api.open-meteo.com/v1/elevation`
- Query shape: Comma-separated latitude/longitude lists.
- Response format: JSON elevation array.
- Update cadence: Static DEM-backed service.
- Error handling: Validate array length equals requested points.
- Required attribution/provenance: Open-Meteo CC BY 4.0 attribution.

## Next Step

- Densify one GPX/OSM route and compare total ascent against AWS Terrain Tiles.
