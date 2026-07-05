# Curated Seed List Analysis

## Verdict

- Verdict: `viable`
- MVP role: Seed candidate discovery before automated mining is trustworthy.
- Production role: Editorial/source-backed route catalog that can be expanded by OSM mining and user imports.
- Confidence: High for route identity, medium for coordinates/logistics until each route is verified against geometry and official transport sources.

## Access

- Access model: Manual curation from public route/tourism pages.
- Auth required: No.
- Cost/pricing: No.
- Rate limits: Human review only.
- Terms reviewed: Per-source page terms still needed before copying descriptions or media.
- Storage/cache permission: Store minimal factual metadata and source URLs; avoid page text/media copying.
- Attribution: Keep `primary_source_url` per route.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Route ID/name | Yes | Enough for search and dossier seed. |
| Country/region | Yes | Useful for coverage planning. |
| Trailhead coordinates | Yes | Approximate sample coordinates included. |
| Route type | Yes | Point-to-point, loop, out-and-back, multi-day. |
| Quality tags | Yes | Manual, explainable, non-proprietary. |
| Logistics gaps | Yes | Highlights sources needed next. |
| Full geometry | No | Needs GPX/OSM route extraction. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| 7 seed routes | Complete sample | `raw/manual-source-log.json` | `normalized/seed-routes.sample.json` | Covers Norway, Iceland, Scotland, Dolomites, and Sweden. |

## Technical Limitations

- Manual coordinates are approximate and must not be treated as navigation-grade.
- Route descriptions, distances, seasons, and warnings should be source-linked rather than copied unless terms permit.
- Manual tags are useful for ranking prototypes but need review workflow and versioning.

## Opportunities

- Gives candidate discovery a high-quality starting set while OSM mining is still noisy.
- Captures known logistics gaps that drive future data-source tests.
- Provides stable route IDs for joining OSM POIs, Commons media, weather, transit, and provenance.

## Integration Notes

- Endpoint/feed: Internal curated JSON.
- Query shape: Route list keyed by `id`.
- Response format: JSON.
- Update cadence: Manual seasonal review plus source-change checks.
- Error handling: Flag stale seed rows when source URL or critical logistics are unverified.
- Required attribution/provenance: Preserve source URL per route and confidence per field in production.

## Next Step

- Expand to 25 routes and split source-level facts from editorial quality tags with field-level provenance.
