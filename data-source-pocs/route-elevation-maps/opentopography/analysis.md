# OpenTopography Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Benchmark DEM raster source for route-profile validation.
- Production role: Backend precomputation source if quotas/terms fit.
- Confidence: Medium.

## Access

- Access model: REST API; dataset-specific access and API keys.
- Auth required: Some datasets require API key.
- Cost/pricing: Terms reviewed; quota/cost details depend on account/dataset.
- Rate limits: Dataset/API-specific.
- Terms reviewed: https://portal.opentopography.org/apidocs/, https://opentopography.org/usageterms
- Storage/cache permission: Dataset-specific; preserve dataset license/citation.
- Attribution: OpenTopography and dataset citation/attribution required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| DEM raster clip | Yes | Supports global datasets including SRTM, ALOS, NASADEM, Copernicus. |
| Route elevation profile | Derived | Sample route geometry against raster. |
| Metadata | Yes | Dataset/source dependent. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | Access check | raw/access-check.json | normalized/source-verdict.json | Key not configured. |

## Technical Limitations

- More setup than point APIs.
- Quotas and license/citation vary by dataset.

## Opportunities

- Good benchmark for comparing AWS Terrain Tiles and Open-Meteo point results.

## Integration Notes

- Endpoint/feed: OpenTopography global datasets API.
- Query shape: Dataset name plus bbox and output format.
- Response format: Raster files/metadata.
- Update cadence: Dataset-specific.
- Error handling: Handle key/quota errors and large bbox rejection.
- Required attribution/provenance: Dataset-specific citation and OpenTopography acknowledgement.

## Next Step

- Add `.env.example` and key-gated raster clip POC if this becomes a production candidate.
