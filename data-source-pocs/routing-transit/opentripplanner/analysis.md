# OpenTripPlanner Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Follow-up if Entur/Rejseplanen/hosted APIs cannot cover required workflows.
- Production role: Self-hosted multimodal planner from OSM plus GTFS/NeTEx feeds.
- Confidence: Medium.

## Access

- Access model: Open-source/self-hosted.
- Auth required: No for our deployment.
- Cost/pricing: Infrastructure, graph builds, feed maintenance.
- Rate limits: Controlled by our deployment.
- Terms reviewed: Official OTP docs.
- Storage/cache permission: Depends on OSM and each transit feed license.
- Attribution: OSM and feed/operator attribution.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Multimodal trips | Yes | Requires valid street and transit graph. |
| GTFS/NeTEx schedule planning | Yes | Good fit for national/regional feeds. |
| Realtime | Possible | Requires realtime feeds. |
| Local private shuttles | Only if feed exists | Manual adapters likely still needed. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Norway graph compared to Entur | Not run | None | `normalized/self-host-followup.json` | Requires OSM plus Entur/GTFS/NeTEx input preparation. |

## Technical Limitations

- Graph build and feed hygiene are non-trivial.
- Local tourist services still need source-specific data if no feed exists.

## Opportunities

- Gives us control over caching, confidence labels, and cross-border feed composition.
- Useful if Transitland/Rejseplanen/Entur feeds can be loaded consistently.

## Integration Notes

- Endpoint/feed: self-hosted OTP GraphQL/REST after graph build.
- Query shape: OTP trip planning request.
- Response format: JSON/GraphQL depending on API selected.
- Update cadence: Street graph plus scheduled transit feed refresh.
- Error handling: graph build failures, feed validation, stale trips, impossible itineraries.
- Required attribution/provenance: OSM extract date, feed versions, OTP version.

## Next Step

- Build a Norway graph only after feed rights and Entur-vs-OTP comparison goals are clear.
