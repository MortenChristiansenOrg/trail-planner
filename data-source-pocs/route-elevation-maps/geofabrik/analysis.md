# Geofabrik OSM Extracts Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Batch OSM import source once route extraction logic is proven.
- Production role: Preferred OSM source for repeatable indexing over public Overpass.
- Confidence: Medium.

## Access

- Access model: Public regional OSM PBF/shapefile downloads.
- Auth required: No.
- Cost/pricing: Free download service.
- Rate limits: Not evaluated; use politely and avoid repeated large downloads.
- Terms reviewed: https://www.geofabrik.de/data/download.html, https://www.openstreetmap.org/copyright
- Storage/cache permission: OSM ODbL compliance required.
- Attribution: OSM attribution required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Hiking route relations | Yes | Same source data as Overpass. |
| Path geometry/tags | Yes | Requires local parser/import. |
| POIs | Yes | Requires tag filtering. |
| Fresh regional updates | Yes | Geofabrik says extracts are normally updated daily. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Norway/Great Britain route areas | Not run | raw/access-check.json | normalized/source-verdict.json | Access checked only. |

## Technical Limitations

- Requires import tooling, disk, update jobs, and ODbL provenance discipline.
- Country extracts are overkill for a tiny POC unless we add osmium/pyosmium.

## Opportunities

- Production-grade replacement for public Overpass.
- Enables candidate mining across Norway, Scotland, Iceland, Alps, and Denmark.

## Integration Notes

- Endpoint/feed: `https://download.geofabrik.de/`
- Query shape: Download regional PBF, then local OSM filtering.
- Response format: `.osm.pbf` or shapefile archives.
- Update cadence: Normally daily.
- Error handling: Check file timestamps and checksums.
- Required attribution/provenance: OSM ODbL attribution.

## Next Step

- Add a tiny local extraction POC with `osmium tags-filter` for one regional extract.
