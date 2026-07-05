# Valhalla Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Not needed for first hosted-source proof unless custom routing is required.
- Production role: Self-hosted multimodal/custom-costing engine candidate.
- Confidence: Medium.

## Access

- Access model: Open-source/self-hosted.
- Auth required: No for self-hosted.
- Cost/pricing: Infrastructure and data-pipeline cost.
- Rate limits: Controlled by our deployment.
- Terms reviewed: Official Valhalla docs/GitHub.
- Storage/cache permission: Depends on OSM/transit feed licenses.
- Attribution: OSM and transit-feed attribution.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Road routes | Yes, self-hosted | Requires OSM tile build. |
| Matrices/isochrones | Yes | Useful for candidate screening. |
| Pedestrian/bike costing | Yes | Could help trailhead approach routing. |
| Transit | Possible | Requires feed ingestion and more setup. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Aalborg/Norway routing | Not run | None | `normalized/self-host-followup.json` | Requires local OSM/transit build. |

## Technical Limitations

- More setup than hosted APIs.
- Transit production maturity depends on feed pipeline and Valhalla deployment choices.

## Opportunities

- Full control over costing, caching, and matrix volume.
- Good future route planner if hosted APIs become too expensive or restrictive.

## Integration Notes

- Endpoint/feed: self-hosted `valhalla_service`.
- Query shape: POST `/route` with locations and costing.
- Response format: JSON.
- Update cadence: Our OSM/feed refresh cadence.
- Error handling: graph build failures, no route, stale tiles.
- Required attribution/provenance: OSM extract version, feed versions, Valhalla version.

## Next Step

- Defer until hosted road-routing comparison shows cost/limits require self-hosting.
