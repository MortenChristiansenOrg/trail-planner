# MapLibre GL JS Analysis

## Verdict

- Verdict: viable
- MVP role: Web map renderer.
- Production role: Primary renderer if using vector tiles.
- Confidence: High.

## Access

- Access model: Open-source JS library.
- Auth required: No.
- Cost/pricing: BSD-3-Clause software license.
- Rate limits: Not applicable.
- Terms reviewed: https://maplibre.org/maplibre-gl-js/docs/, https://github.com/maplibre/maplibre-gl-js
- Storage/cache permission: Not a data source.
- Attribution: Tile/data provider attribution must be shown separately.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Base map data | No | Requires tiles/style provider. |
| Route overlay rendering | Yes | Render GeoJSON line/markers. |
| Terrain visualization | Possible | Requires DEM/terrain source. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Route map rendering | Access check | raw/access-check.json | normalized/source-verdict.json | Needs app/frontend context. |

## Technical Limitations

- Does not solve tile hosting, geocoding, attribution, or source licensing.

## Opportunities

- Keeps renderer open-source and tile-provider agnostic.

## Integration Notes

- Endpoint/feed: N/A.
- Query shape: Style JSON plus vector/raster tile URLs and GeoJSON overlays.
- Response format: Browser-rendered map.
- Update cadence: Library releases.
- Error handling: Missing style/tile errors and WebGL support.
- Required attribution/provenance: Data provider attribution.

## Next Step

- Build a tiny map screen after choosing MapTiler Cloud or OpenMapTiles tiles.
