# Copernicus DEM Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Underlying DEM reference, not the fastest MVP API.
- Production role: Strong candidate for self-managed terrain cache.
- Confidence: Medium.

## Access

- Access model: Open dataset via Copernicus services and cloud platforms.
- Auth required: Platform-dependent.
- Cost/pricing: Dataset free license per Copernicus docs; platform costs may apply.
- Rate limits: Platform-dependent.
- Terms reviewed: https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
- Storage/cache permission: Copernicus license/citation obligations apply.
- Attribution: Cite Copernicus DEM/source as required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| GLO-30/GLO-90 DEM | Yes | DSM, not bare-earth DTM. |
| Route profile | Derived | Requires raster/tile processing. |
| Terrain/ruggedness | Derived | Good for slope/ruggedness features. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Target routes | Access check | raw/access-check.json | normalized/source-verdict.json | Direct ingestion not run. |

## Technical Limitations

- DSM includes buildings/vegetation; usually acceptable for trail planning, but profiles can differ from bare-earth terrain.
- Direct ingestion requires raster tooling and cache design.

## Opportunities

- Consistent Europe-wide terrain source for route scoring.

## Integration Notes

- Endpoint/feed: Copernicus Data Space, AWS Open Data, OpenTopography, or other platforms.
- Query shape: Tile/raster selection by bbox.
- Response format: GeoTIFF/COG depending on platform.
- Update cadence: Dataset release dependent.
- Error handling: Missing public tiles/platform auth differences.
- Required attribution/provenance: Copernicus DEM citation/license.

## Next Step

- Use OpenTopography or AWS Copernicus DEM to fetch one route-area raster.
