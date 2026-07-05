# AWS Terrain Tiles Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Route elevation profile prototype.
- Production role: Candidate for cached DEM tile sampling.
- Confidence: High for access, medium for precision until profile comparison is done.

## Access

- Access model: Public S3/object URLs through AWS Open Data.
- Auth required: No for tested tile URLs.
- Cost/pricing: Open data access; application egress/caching strategy still matters.
- Rate limits: No application SLA; treat as public dataset infrastructure.
- Terms reviewed: https://registry.opendata.aws/terrain-tiles/
- Storage/cache permission: Check Tilezen/Joerd attribution and source data terms.
- Attribution: Tilezen/Mapzen terrain tile attribution plus underlying source attribution.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| DEM tile | Yes | Terrarium PNG, 256x256. |
| Point elevation | Yes | Decoded from RGB. |
| Route profile | Yes | Requires polyline sampling, interpolation, tile cache. |
| Terrain/ruggedness | Yes | Can derive from local DEM windows. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | Success | raw/sample-besseggen-ridge.png | normalized/sample-route-points.json | Decoded ridge sample 1706.85 m. |
| Ben Nevis CMD | Success | raw/sample-ben-nevis-summit.png | normalized/sample-route-points.json | Decoded summit sample 1316.05 m. |

## Technical Limitations

- Need interpolation across pixels and tiles for stable profiles.
- Need smoothing rules for ascent/descent; raw DEM noise can inflate gain.
- Need attribution details confirmed before using tiles publicly.

## Opportunities

- Public, keyless route-profile engine for prototypes.
- Cache tiles by z/x/y and reuse across route dossiers.

## Integration Notes

- Endpoint/feed: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`
- Query shape: Web Mercator tile coordinates.
- Response format: Terrarium PNG.
- Update cadence: Registry says new data added based on community feedback.
- Error handling: Handle missing tiles and PNG format variations.
- Required attribution/provenance: Terrain Tiles/Tilezen and underlying data attribution.

## Next Step

- Add polyline densification and compare total ascent/descent against public route descriptions.
